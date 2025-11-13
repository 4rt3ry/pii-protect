import pyotp
import time
import json
from pathlib import Path

TOTP_SECRET_PATH = Path(__file__).parent / "data/sampleSecrets.json"

def get_totp_token(secret: str) -> str:
    """
    Generate a time based token
    """
    totp = pyotp.TOTP(secret)
    return totp.now()

def verify_totp_token(secret: str, token: str) -> bool:
    """
    Verify the given token with the expected time based token
    """
    expected_token = pyotp.TOTP(secret).now()
    return expected_token == token



def get_totp_secret() -> str:
    """
    Returns the sample totp secret as a string
    """
    with open(TOTP_SECRET_PATH, 'r') as totp_file:
        return json.load(totp_file)["totp_secret"]



