
from contextlib import asynccontextmanager
import json
from pathlib import Path
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from pydantic import BaseModel
from db import patients

app = FastAPI()

app.add_middleware(HTTPSRedirectMiddleware)

# allows for cross orgin calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO set to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    
class PatientVerify(BaseModel):
    first_name: str
    last_name: str
    ssn_last_4: str
    phone: str

@app.get("/", response_model=BaseModel)
async def get_root():
    return {}
    
@app.get("/patients", response_model=List[Patient])
async def get_patients():
    return patient_data


@app.get("/patients/{patient_id}", response_model=Patient)
async def get_patient(patient_id: str):
    for patient in patient_data:
        if patient["patient_id"] == patient_id:
            return patient
    raise HTTPException(status_code=404, detail="Patient not found")

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
