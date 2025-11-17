
from contextlib import asynccontextmanager
import json
from pathlib import Path
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.requests import Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel
from db import patients
from totp import get_totp_secret, verify_totp_token
from session import create_session_string, validate_session, end_session
from datetime import datetime, timedelta

app = FastAPI()

# minutes
TOKEN_EXPIRATION = 10


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
app.add_middleware(SessionMiddleware, secret_key="TEMP_KEY")

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
    
    
class PatientVerify(BaseModel):
    first_name: str
    last_name: str
    ssn_last_4: str
    phone: str

class Success(BaseModel):
    success: bool

@app.get("/", response_model=dict)
async def get_root():
    return {}

@app.get("/success", response_model=Success)
async def get_success():
    return { "success": True }
    
@app.get("/patients", response_model=List[Patient])
async def get_patients():
    return patient_data


@app.get("/patients/{patient_id}", response_model=Patient)
async def get_patient(patient_id: str):
    for patient in patient_data:
        if patient["patient_id"] == patient_id:
            return patient
    raise HTTPException(status_code=404, detail="Patient not found")

# TODO: session is ended after pii is verified
@app.post("/verify_pii")
def verify_pii(payload: PatientVerify):
    first = payload.first_name.lower()
    last = payload.last_name.lower()
    ssn = payload.ssn_last_4
    phone = payload.phone.replace(" ", "").replace("-", "")
    
    # TODO Decrypt patient data to pass in
    patient = patients.lookup_patient(first, last, ssn, phone)
    
    if(patient):
        # TODO OR call some function to decrypt and verify information
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


    

### IF WE WANTED ANOTHER LAYER

# @app.get("/patients", response_model=List[Patient])
# def read_patients():
#     return get_all_patients()

# @app.get("/patients/{patient_id}", response_model=Patient)
# def read_patient(patient_id: str):
#     patient = get_patient_by_id(patient_id)
#     if not patient:
#         raise HTTPException(status_code=404, detail="Patient not found")
#     return patient
