from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from ...core.database import get_db
from ...core.security import create_access_token, verify_password, get_current_user, get_password_hash, require_roles
from ...core.config import settings
from ...models import User, UserRole
from ...schemas import UserCreate, UserLogin, Token, User as UserSchema

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserSchema)
def register(user_data: UserCreate, db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.ADMIN.value, UserRole.JEFE_DESARROLLO.value))):
    """Registro de trabajadores: solo ADMINISTRADOR y JEFE DE DESARROLLO pueden crear cuentas."""
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
        phone=user_data.phone,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(subject=user.id, expires_delta=access_token_expires)
    return Token(access_token=access_token, user=user)


@router.post("/forgot-password")
def forgot_password(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Reset password email sent (simulated)", "token": create_access_token(user.id, timedelta(minutes=30))}


@router.post("/reset-password")
def reset_password(token: str, new_password: str, db: Session = Depends(get_db)):
    user = get_current_user(token=token, db=db)
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@router.get("/me", response_model=UserSchema)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
