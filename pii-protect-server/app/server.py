
from contextlib import asynccontextmanager
import json
from pathlib import Path
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.requests import Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel
from db import patients
from totp import get_totp_secret, verify_totp_token
from session import create_session_string, validate_session, end_session
from datetime import datetime, timedelta
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.exceptions import InvalidKey
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import base64

app = FastAPI()

# minutes
TOKEN_EXPIRATION = 10
ECDH_ALGO = ec.SECP384R1

app.add_middleware(HTTPSRedirectMiddleware)

# allows for cross orgin calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO set to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# RAM based session storage
# TODO: replace key with environment variable
app.add_middleware(SessionMiddleware, secret_key=create_session_string())

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
@app.post("/verify_pii")
def verify_pii(request: Request, payload: VerifyData):
    
    session_id = request.session.get("session_id")
    token_exp = request.session.get("token_expiration")
    
    if not session_id or not token_exp or datetime.now().timestamp() > token_exp:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    
    raw_key = request.session["session_key"] 
    if not raw_key:
        raise HTTPException(status_code=400, detail="Session key not found")
    session_key = base64.b64decode(raw_key, 'ascii')
    
    try:
        aesgcm = AESGCM(session_key)
        iv = base64.b64decode(payload["iv"])
        ciphertext = base64.b64decode(payload["ciphertext"])
        decrypted_bytes = aesgcm.decrypt(iv, ciphertext, None)
        decrypted = json.loads(decrypted_bytes.decode("utf-8"))
        
        first = decrypted.first_name.lower()
        last = decrypted.last_name.lower()
        ssn = decrypted.ssn_last_4
        phone = decrypted.phone.replace(" ", "").replace("-", "")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to decrypt: {str(e)}")
        
    # TODO Decrypt patient data to pass in
    patient = patients.lookup_patient(first, last, ssn, phone)
    
    if(patient):
        # TODO OR call some function to decrypt and verify information
        end_session(request)
        return {"status": "verified", "patient_id": patient["patient_id"]}
    else:
        raise HTTPException(status_code=404, detail="PII verification failed")

@app.post("/verify_totp")
def verify_totp(request: Request, response: RedirectResponse, totp: TotpPayload):
    secret = get_totp_secret()
    verified = verify_totp_token(secret, totp.totp)

    if verified:
        # TODO: create session id with uuid4
        # TODO: store sessions in database (most likely server RAM)
        # TODO: add session as dependency for certain endpoints

        session_id = create_session_string()
        # request.session["session_id"] = session_id
        request.session["session_id"] = session_id

        next_expiration = datetime.now() + timedelta(minutes=TOKEN_EXPIRATION)
        request.session["token_expiration"] = next_expiration.timestamp()
        response.set_cookie(key="Authorization", value=session_id)
        return RedirectResponse("/success", status_code=303)

    else:
        raise HTTPException(status_code=401, detail="TOTP failed")

@app.post("/post_public_key", response_model = Publickey)
def post_key_half(request: Request, payload: Publickey):
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

    request.session["session_key"] = base64.b64encode(derived_key).decode('ascii')

    server_public_key = private_key.public_key()
    serialized_server_public_key = server_public_key.public_bytes(
            encoding = serialization.Encoding.PEM,
            format = serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return { "public_key": serialized_server_public_key }
