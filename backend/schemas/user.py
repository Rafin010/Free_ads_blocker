from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Shared properties
class UserBase(BaseModel):
    email: EmailStr

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    referral_code: Optional[str] = None

# Properties to receive via API on login
class UserLogin(UserBase):
    password: str

# Properties to receive via API on update
class UserUpdate(BaseModel):
    password: Optional[str] = None
    is_premium: Optional[bool] = None

# Properties to return to client
class User(UserBase):
    id: int
    is_active: bool
    is_premium: bool
    referral_code: Optional[str] = None
    referral_count: int
    created_at: datetime

    class Config:
        from_attributes = True

# Token response
class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None
    referral_code: Optional[str] = None
    is_premium: bool = False
