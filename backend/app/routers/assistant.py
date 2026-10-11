
import json
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.plant import Plant
from backend.app.models.chat import ChatSession, ChatMessage
from backend.app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageOut,
    ChatSessionOut,
    ChatSessionDetailOut,
    GardeningAdviceResponse,
)
from backend.app.services.ai_service import ai_service
from backend.app.utils.security import get_current_user


router = APIRouter(
    prefix="/api/assistant",
    tags=["AI Gardening Assistant"],
)


def get_valid_datetime(
    value: Optional[datetime],
    fallback: Optional[datetime] = None,
) -> datetime:
    """Return a valid datetime when a database timestamp is missing."""
    if value is not None:
        return value

    if fallback is not None:
        return fallback

    return datetime.now(timezone.utc)


def get_session_output(session: ChatSession, message_count: int) -> ChatSessionOut:
    """Build a chat-session response with valid timestamps."""
    created_at = get_valid_datetime(session.created_at)
    updated_at = get_valid_datetime(session.updated_at, created_at)

    return ChatSessionOut(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        created_at=created_at,
        updated_at=updated_at,
        message_count=message_count,
    )


@router.get("/sessions", response_model=List[ChatSessionOut])
def get_user_chat_sessions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )

    results = []

    for session in sessions:
        message_count = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session.id)
            .count()
        )

        results.append(
            get_session_output(session, message_count)
        )

    return results


@router.get(
    "/sessions/{session_id}",
    response_model=ChatSessionDetailOut,
)
def get_session_detail(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found",
        )

    messages_out = []

    for message in session.messages:
        followups = []

        if message.suggested_followups:
            try:
                parsed_followups = json.loads(
                    message.suggested_followups
                )

                if isinstance(parsed_followups, list):
                    followups = parsed_followups
            except (json.JSONDecodeError, TypeError):
                followups = []

        messages_out.append(
            ChatMessageOut(
                id=message.id,
                session_id=message.session_id,
                role=message.role,
                content=message.content,
                suggested_followups=followups,
                created_at=get_valid_datetime(message.created_at),
            )
        )

    created_at = get_valid_datetime(session.created_at)
    updated_at = get_valid_datetime(session.updated_at, created_at)

    return ChatSessionDetailOut(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        created_at=created_at,
        updated_at=updated_at,
        messages=messages_out,
    )


@router.post(
    "/chat",
    response_model=GardeningAdviceResponse,
)
async def chat_with_assistant(
    req: ChatMessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Retrieve the requested session belonging to this user.
    session = None

    if req.session_id:
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == req.session_id,
                ChatSession.user_id == user.id,
            )
            .first()
        )

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found",
            )

    # Create a new conversation when no session ID is provided.
    if session is None:
        content = req.content.strip()

        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message cannot be empty.",
            )

        title = content[:35] + ("..." if len(content) > 35 else "")

        session = ChatSession(
            user_id=user.id,
            title=title,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        db.add(session)
        db.flush()

    # Save the user's message.
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=req.content,
    )

    db.add(user_msg)

    # Explicitly update the session timestamp.
    session.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(session)

    # Load recent conversation history.
    history_msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(8)
        .all()
    )

    formatted_history = [
        {
            "role": message.role,
            "content": message.content,
        }
        for message in history_msgs
    ]

    # Gather the user's saved plants for additional context.
    plants_context = []

    if req.include_plant_context:
        user_plants = (
            db.query(Plant)
            .filter(Plant.user_id == user.id)
            .all()
        )

        plants_context = [
            {
                "common_name": plant.common_name,
                "category": plant.category,
                "location_type": plant.location_type,
                "watering_frequency_days": plant.watering_frequency_days,
                "sunlight_requirement": plant.sunlight_requirement,
            }
            for plant in user_plants
        ]

    # Generate gardening advice using the configured AI service.
    ai_result = await ai_service.generate_gardening_advice(
        messages=formatted_history,
        user_plants=plants_context,
    )

    if not isinstance(ai_result, dict) or not ai_result.get("reply"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The gardening assistant could not generate a response.",
        )

    # Save the assistant's response.
    response_time = datetime.now(timezone.utc)

    asst_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=ai_result["reply"],
        suggested_followups=json.dumps(
            ai_result.get("suggested_followups", [])
        ),
        created_at=response_time,
    )

    db.add(asst_msg)
    session.updated_at = response_time

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return GardeningAdviceResponse(
        reply=ai_result["reply"],
        suggested_followups=ai_result.get("suggested_followups", []),
        plants_referenced=ai_result.get("plants_referenced", []),
        is_ai_generated=True,
    )


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_chat_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    db.delete(session)
    db.commit()

    return None
