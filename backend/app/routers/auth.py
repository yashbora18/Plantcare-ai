from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.preferences import UserPreference

from backend.app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserProfile,
    UserPreferenceUpdate,
    UserPreferenceOut,
)

from backend.app.utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


# ============================================================
# AUTHENTICATE USER
# Supports both email and username.
# ============================================================

def authenticate_user(
    identifier: str,
    password: str,
    db: Session,
) -> User:
    identifier = identifier.strip()

    user = (
        db.query(User)
        .filter(
            or_(
                User.email == identifier.lower(),
                User.username == identifier,
            )
        )
        .first()
    )

    if not user or not verify_password(
        password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated.",
        )

    return user


# ============================================================
# CREATE ACCESS TOKEN
# ============================================================

def create_user_token(user: User) -> TokenResponse:
    token = create_access_token(
        {
            "sub": str(user.id),
            "username": user.username,
        }
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        email=user.email,
    )


# ============================================================
# REGISTER USER
# POST /api/auth/register
# ============================================================

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    req: UserRegister,
    db: Session = Depends(get_db),
):
    email = req.email.strip().lower()
    username = req.username.strip()

    existing = (
        db.query(User)
        .filter(
            or_(
                User.email == email,
                User.username == username,
            )
        )
        .first()
    )

    if existing:
        if existing.email.lower() == email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered.",
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken.",
        )

    user = User(
        email=email,
        username=username,
        full_name=req.full_name,
        hashed_password=get_password_hash(req.password),
    )

    try:
        db.add(user)
        db.flush()

        preference = UserPreference(
            user_id=user.id,
            theme="light",
            outdoor_goal_minutes=120,
            experience_level="beginner",
        )

        db.add(preference)
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    return create_user_token(user)


# ============================================================
# FRONTEND LOGIN
# POST /api/auth/login
#
# Accepts JSON:
# {
#   "username_or_email": "user@example.com",
#   "password": "your-password"
# }
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login_user(
    req: UserLogin,
    db: Session = Depends(get_db),
):
    user = authenticate_user(
        identifier=req.username_or_email,
        password=req.password,
        db=db,
    )

    return create_user_token(user)


# ============================================================
# SWAGGER OAUTH2 LOGIN
# POST /api/auth/token
#
# Accepts form fields:
# username: user email or username
# password: account password
#
# Returns the standard OAuth2 token response.
# ============================================================

@router.post(
    "/token",
    include_in_schema=False,
)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(
        identifier=form_data.username,
        password=form_data.password,
        db=db,
    )

    token = create_access_token(
        {
            "sub": str(user.id),
            "username": user.username,
        }
    )

    # Swagger OAuth2 expects access_token and token_type.
    return {
        "access_token": token,
        "token_type": "bearer",
    }


# ============================================================
# GET CURRENT USER
# GET /api/auth/me
# Requires a valid bearer token.
# ============================================================

@router.get(
    "/me",
    response_model=UserProfile,
)
def get_current_user_profile(
    user: User = Depends(get_current_user),
):
    return user


# ============================================================
# UPDATE USER PREFERENCES
# PUT /api/auth/preferences
# Requires a valid bearer token.
# ============================================================

@router.put(
    "/preferences",
    response_model=UserPreferenceOut,
)
def update_user_preferences(
    req: UserPreferenceUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    preference = user.preference

    if preference is None:
        preference = UserPreference(
            user_id=user.id,
            theme="light",
            outdoor_goal_minutes=120,
            experience_level="beginner",
        )
        db.add(preference)

    if req.theme is not None:
        preference.theme = req.theme

    if req.outdoor_goal_minutes is not None:
        preference.outdoor_goal_minutes = (
            req.outdoor_goal_minutes
        )

    if req.gardening_zone is not None:
        preference.gardening_zone = req.gardening_zone

    if req.experience_level is not None:
        preference.experience_level = req.experience_level

    if req.notifications_enabled is not None:
        preference.notifications_enabled = (
            req.notifications_enabled
        )

    try:
        db.commit()
        db.refresh(preference)

    except Exception:
        db.rollback()
        raise

    return preference
