
from contextlib import asynccontextmanager
import json
from pathlib import Path
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# allows for cross orgin calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO set to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = Path(__file__).parent / "mockPatients.json"
with open(DATA_PATH, "r") as f:
    data = json.load(f) 

# will allow FastAPI to validate and sterialize data when passed in
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
def get_patients():
    return data["patients"]

@app.get("/patients/{patient_id}", response_model=Patient)
def get_patient(patient_id: str):
    for patient in data["patients"]:
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