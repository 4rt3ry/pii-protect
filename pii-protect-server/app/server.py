
from contextlib import asynccontextmanager
import json
from pathlib import Path
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from db import patients

app = FastAPI()

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
    
@app.get("/patients", response_model=List[Patient])
async def get_patients():
    return patient_data


@app.get("/patients/{patient_id}", response_model=Patient)
async def get_patient(patient_id: str):
    for patient in patient_data:
        if patient["patient_id"] == patient_id:
            return patient
    raise HTTPException(status_code=404, detail="Patient not found")

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