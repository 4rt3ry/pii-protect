
from contextlib import asynccontextmanager
import json
from pathlib import Path
from typing import List
from pydantic import BaseModel
from db import patients
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

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

class PatientAuthInfo(BaseModel):
    first_name: str
    last_name: str
    phone: str
    ssn_last_four: str
    
class AuthenticationResponse(BaseModel):
    success: bool

@app.get("/", response_model=dict)
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

@app.post("/auth_data", response_model=AuthenticationResponse)
async def post_auth_data(auth_data: PatientAuthInfo):
    # instead of creating a GUI for the service provider to enter user information,
    # once the information is validated, a response is sent to both the user and the service provider

    # input validation
    if len(vars(auth_data)["ssn_last_four"]) != 4:
        raise HTTPException(status_code=400, detail="SSN must be exactly 4 digits")

    current_patient = None
    for patient in patient_data:
        # use phone number as primary key
        if patient["phone"] == vars(auth_data)["phone"]:
            current_patient = patient
            break

    if current_patient == None:
        return { "success": False }

    exact_info = ["first_name", "last_name", "phone"]
   
    validate_exact_info = all([vars(auth_data)[key] == current_patient[key] for key in exact_info])
    validate_ssn = current_patient["ssn"].endswith(vars(auth_data)["ssn_last_four"])

    if validate_exact_info and validate_ssn:
        return { "success": True }

    return { "success": False }

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

