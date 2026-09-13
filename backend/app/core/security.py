import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
from enum import Enum
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from backend.app.core.config import settings

# OWASP recommended Argon2id configuration
pwd_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16
)

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    OPERATOR = "OPERATOR"
    VIEWER = "VIEWER"

def hash_password(password: str) -> str:
    """Hash a plain password using Argon2id."""
    return pwd_hasher.hash(password)

get_password_hash = hash_password

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored Argon2id hash."""
    try:
        return pwd_hasher.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False
    except Exception:
        return False

def create_access_token(
    subject: Union[str, Any],
    role: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Generate signed JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode: Dict[str, Any] = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "type": "access",
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None
) -> tuple[str, str, datetime]:
    """
    Generate signed JWT refresh token and its sha256 hash for db tracking.
    Returns: (raw_token, token_hash, expires_at)
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
    to_encode: Dict[str, Any] = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "iat": datetime.now(timezone.utc)
    }
    raw_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    return raw_token, token_hash, expire

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.PyJWTError:
        return None

def hash_token_string(token: str) -> str:
    """Hash token string with sha256 for database lookup."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
