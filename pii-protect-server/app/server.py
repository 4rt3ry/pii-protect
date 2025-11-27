
from contextlib import asynccontextmanager
import json
from pathlib import Path
from typing import List
from fastapi import FastAPI, HTTPException, Depends, Response
from fastapi.requests import Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel
from db import patients
from totp import get_totp_secret, verify_totp_token
from session import *
from uuid import UUID
from datetime import datetime, timedelta
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.exceptions import InvalidKey
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import base64
from os import getenv
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# minutes
TOKEN_EXPIRATION = 10
ECDH_ALGO = ec.SECP384R1
CLIENT_URL_REGEX = getenv('CLIENT_URL_REGEX')
CLIENT_URLS = getenv('CLIENT_URLS').split()
print(CLIENT_URL_REGEX)
print(CLIENT_URLS)


# app.add_middleware(HTTPSRedirectMiddleware)

# allows for cross orgin calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=CLIENT_URLS,
    #allow_origin_regex=CLIENT_URL_REGEX,  # TODO set to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# RAM based session storage
# TODO: replace key with environment variable
# app.add_middleware(SessionMiddleware, secret_key=create_session_string(), max_age=None, same_site="None")


patient_data = patients.load_patients()

# will allow FastAPI to validate and sterialize patient_data
# when passed in
class Patient(BaseModel):
    patient_id: str
    first_name: str
    last_name: str
    date_of_birth: str
    gender: str
    ssn: str
    phone: str
    email: str
    address: str
    insurance_provider: str
    policy_number: str
    primary_physician: str

class TotpPayload(BaseModel):
    totp: str
    
class VerifyData(BaseModel):
    iv: str
    ciphertext: str

class Success(BaseModel):
    success: bool

class Publickey(BaseModel):
    public_key: str

@app.get("/", response_model=BaseModel)
async def get_root():
    return {}

@app.get("/success", response_model=Success)
async def get_success():
    return { "success": True }

# TODO: session is ended after pii is verified
@app.post("/verify_pii", dependencies=[Depends(session_cookie)])
def verify_pii(request: Request, payload: VerifyData, session_data: SessionData = Depends(session_verifier)):
    
    totp_verified = session_data.totp_verified
    if not totp_verified:
        raise HTTPException(status_code=401, detail="User TOTP not verified")

    raw_key = session_data.session_key
    if not raw_key:
        raise HTTPException(status_code=400, detail="Session key not found")

    session_key = base64.b64decode(raw_key)
    
    try:
        aesgcm = AESGCM(session_key)
        iv = base64.b64decode(payload.iv)
        ciphertext = base64.b64decode(payload.ciphertext)
        decrypted_bytes = aesgcm.decrypt(iv, ciphertext, None)
        decrypted = json.loads(decrypted_bytes.decode("utf-8"))
        
        first = decrypted["first_name"].strip().lower()
        last = decrypted["last_name"].strip().lower()
        ssn = decrypted["ssn_last_4"].strip()
        phone = decrypted["phone"].strip().replace(" ", "").replace("-", "")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to decrypt: {str(e)}")
        
    # TODO Decrypt patient data to pass in
    patient = patients.lookup_patient(first, last, ssn, phone)
    
    if(patient):
        # TODO OR call some function to decrypt and verify information
        # end_session(request)
        return {"status": "verified", "patient_id": patient["patient_id"]}
    else:
        raise HTTPException(status_code=400, detail="PII verification failed")

@app.post("/verify_totp", dependencies=[Depends(session_cookie)])
async def verify_totp(request: Request, totp: TotpPayload, session_data: SessionData = Depends(session_verifier), session_id: UUID = Depends(session_cookie)):
    secret = get_totp_secret()
    verified = verify_totp_token(secret, totp.totp)

    if verified:

        if session_data.session_key == None:
            return RedirectResponse("/")

        session_data.totp_verified = True
        await session_backend.update(session_id, session_data)

        return {"success": True}
        # return RedirectResponse("/success", status_code=303)

    else:
        raise HTTPException(status_code=401, detail="TOTP failed")

@app.post("/post_public_key", response_model = Publickey)
async def post_key_half(request: Request, response: Response, payload: Publickey):

    try:
        serialized_client_public_key = payload.public_key.encode('utf-8')
        client_public_key = serialization.load_pem_public_key(
                serialized_client_public_key
        )
    except (InvalidKey, ValueError):
        return HTTPException(status_code = 400, detail = "invalid key")


    private_key = ec.generate_private_key(ECDH_ALGO())
    # TODO: what is ECDH()? if client doesn't use python, will this still work?
    shared_key = private_key.exchange(ec.ECDH(), client_public_key)
    
    derived_key = HKDF(
            algorithm = hashes.SHA512(),
            length = 32,
            salt = None,
            info = b'handshake data'
    ).derive(shared_key)

    session_key = base64.b64encode(derived_key).decode('ascii')
    await create_session(session_key, response)

    server_public_key = private_key.public_key()
    serialized_server_public_key = server_public_key.public_bytes(
            encoding = serialization.Encoding.PEM,
            format = serialization.PublicFormat.SubjectPublicKeyInfo
    )

    return { "public_key": serialized_server_public_key }
