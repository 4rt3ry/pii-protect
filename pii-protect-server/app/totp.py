import pyotp
import time
import json
from pathlib import Path

TOTP_SECRET_PATH = Path(__file__).parent / "secrets/totpSecrets.json"

CONFIG = {
    "digits": 6,
    "digest": None,
    "name": None,
    "issuer": None,
    "interval": 30,
    "valid_window": 1
}

def get_totp_token(secret: str) -> str:
    """
    Generate a time based token
    """
    totp = pyotp.TOTP(secret, digits=CONFIG["digits"], digest=CONFIG["digest"], name=CONFIG["name"], issuer=CONFIG["issuer"], interval=CONFIG["interval"])
    return totp.now()

def verify_totp_token(secret: str, token: str) -> bool:
    """
    Verify the given token with the expected time based token
    """
    totp = pyotp.TOTP(secret, digits=CONFIG["digits"], digest=CONFIG["digest"], name=CONFIG["name"], issuer=CONFIG["issuer"], interval=CONFIG["interval"])

    return totp.verify(token, valid_window=CONFIG["valid_window"])




def get_totp_secret(phone: str) -> str:
    """
    Returns the sample totp secret as a string
    """
    with open(TOTP_SECRET_PATH, 'r') as totp_file:
        return json.load(totp_file)[phone]



