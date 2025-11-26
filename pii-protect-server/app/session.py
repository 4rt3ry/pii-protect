from pydantic import BaseModel
from fastapi import Request, Response
from fastapi.responses import RedirectResponse
from session_cookie import SessionCookie, CookieParameters
from fastapi_sessions.backends.implementations import InMemoryBackend
from fastapi_sessions.session_verifier import SessionVerifier
from fastapi import HTTPException
from uuid import UUID, uuid4
from datetime import datetime
import secrets

__all__ = ["session_cookie", "session_backend", "session_verifier", "create_session", "delete_session", "SessionData"]

class SessionData(BaseModel):
    session_key: str
    totp_verified: bool

class CustomSessionVerifier(SessionVerifier[UUID, SessionData]):
    def __init__(
            self,
            *,
            identifier: str,
            auto_error: bool,
            backend: InMemoryBackend[UUID, SessionData],
            auth_http_exception: HTTPException):

        self.__identifier = identifier
        self.__auto_error = auto_error
        self.__backend = backend
        self.__auth_http_exception = auth_http_exception
    
    @property
    def identifier(self):
        return self.__identifier

    @property
    def auto_error(self):
        return self.__auto_error
    
    @property
    def backend(self):
        return self.__backend
    
    @property
    def auth_http_exception(self):
        return self.__auth_http_exception

    def verify_session(self, model: SessionData):
        # if session exists, it's valid
        return True

async def create_session(session_key: str, response: Response):
    session = uuid4()
    data = SessionData(session_key=session_key, totp_verified=False)

    await session_backend.create(session, data)
    session_cookie.attach_to_response(response, session)

async def delete_session(session_id: UUID, response: Response):
    try:
        await session_backend.delete(session_id)
    except:
        print(f"Failed to remove session {session_id}")

    if response != None:
        try:
            session_cookie.delete_from_response(response)
        except:
            # silent failure
            print(f"Failed to remove cookie {session_id}")


# def create_session_string() -> str:
#     return secrets.token_urlsafe(32)
# 
# def validate_session(request: Request):
#     session_auth = request.cookies.get("Authorization")
#     session_id = request.session.get("session_id")
#     session_access_token = request.session.get("access_token")
#     token_exp = request.session.get("token_expiration")
# 
#     if not session_auth or not session_access_token:
#         return False
# 
#     if session_auth != session_id:
#         return False
# 
#     if not token_exp or check_expired(token_exp):
#         return False
# 
#     return True
# 
# def end_session(request: Request response: RedirectResponse):
#     request.session.clear()
#     response.delete_cookie(key="Authorization")
# 
# 
# def check_expired(timestamp: int) -> bool:
#     try:
#         exp_datetime = datetime.fromtimestamp(timestamp)
#         current_time = datetime.now()
#         return (exp_datetime - current_time).total_seconds <= 0
# 
#     except:
#         # invalid timestamp
#         return True


# TODO: perhaps move to server.py
cookie_params = CookieParameters(
        samesite="none",
        secure=True)

session_cookie = SessionCookie(
        cookie_name="session",
        identifier="Authorization",
        auto_error=True,
        secret_key="",
        cookie_params=cookie_params
        )

session_backend = InMemoryBackend[UUID, SessionData]()
session_verifier = CustomSessionVerifier(
        identifier="Authorization", 
        auto_error=False, 
        backend=session_backend, 
        auth_http_exception=HTTPException(status_code=403, detail="invalid session")
        )
