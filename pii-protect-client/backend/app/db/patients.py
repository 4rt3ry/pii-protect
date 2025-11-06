from pathlib import Path
import json
from typing import List, Optional
from pydantic import BaseModel

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

DATA_PATH = Path(__file__).parent / "patients.json"

def load_patients() -> List[dict]:
    """Load patients from JSON file."""
    with open(DATA_PATH, "r") as f:
        data = json.load(f)
    return data["patients"]

def get_all_patients() -> List[Patient]:
    """Return all patients as Patient objects."""
    patients = load_patients()
    return [Patient(**p) for p in patients]

def get_patient_by_id(patient_id: str) -> Optional[Patient]:
    """Return a single patient by ID."""
    patients = load_patients()
    for p in patients:
        if p["patient_id"] == patient_id:
            return Patient(**p)
    return None