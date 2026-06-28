from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.user import UserCreate, UserLogin, Token
from utils.security import verify_password, get_password_hash, create_access_token
import secrets
import string

router = APIRouter()

def generate_referral_code():
    alphabet = string.ascii_uppercase + string.digits
    hex_code = ''.join(secrets.choice(alphabet) for i in range(6))
    return f"SHIELDX-{hex_code}"

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Process referral code if provided
    referred_by = None
    if user_in.referral_code:
        referrer = db.query(User).filter(User.referral_code == user_in.referral_code).first()
        if referrer:
            referred_by = referrer.referral_code
            referrer.referral_count += 1
            # Auto-upgrade to premium if reached 5 referrals
            if referrer.referral_count >= 5 and not referrer.is_premium:
                referrer.is_premium = True
            db.add(referrer)

    # Create new user
    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        referral_code=generate_referral_code(),
        referred_by=referred_by
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate token
    access_token = create_access_token(data={"sub": new_user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": "dummy_refresh_token",  # Implement real refresh logic if needed
        "referral_code": new_user.referral_code,
        "is_premium": new_user.is_premium
    }

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": "dummy_refresh_token",
        "referral_code": user.referral_code,
        "is_premium": user.is_premium
    }
