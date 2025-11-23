
from fastapi import Request, Response
from fastapi.responses import RedirectResponse
from datetime import datetime
import secrets

def create_session_string() -> str:
    return secrets.token_urlsafe(32)

def validate_session(request: Request):
    session_auth = request.cookies.get("Authorization")
    session_id = request.session.get("session_id")
    session_access_token = request.session.get("access_token")
    token_exp = request.session.get("token_expiration")

    if not session_auth or not session_access_token:
        return False

    if session_auth != session_id:
        return False

    if not token_exp or check_expired(token_exp):
        return False

    return True

def end_session(request: Request, response: RedirectResponse):
    request.session.clear()
    response.delete_cookie(key="Authorization")


def check_expired(timestamp: int) -> bool:
    try:
        exp_datetime = datetime.fromtimestamp(timestamp)
        current_time = datetime.now()
        return (exp_datetime - current_time).total_seconds <= 0

    except:
        # invalid timestamp
        return True


