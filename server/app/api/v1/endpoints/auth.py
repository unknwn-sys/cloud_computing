from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ....core.security import verify_password, create_access_token
from ....db.session import get_db
from ....models.user import User
from ....schemas.auth import LoginRequest, TokenResponse

router = APIRouter()

@router.post('/login', response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    return TokenResponse(access_token=create_access_token(str(user.id)))
