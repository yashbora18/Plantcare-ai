from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[int] = None
    include_plant_context: bool = True

class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    role: str
    content: str
    suggested_followups: List[str] = []
    created_at: datetime

class ChatSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

class ChatSessionDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageOut] = []

class GardeningAdviceResponse(BaseModel):
    reply: str
    suggested_followups: List[str] = []
    plants_referenced: List[str] = []
    is_ai_generated: bool = True
    disclaimer: str = "This advice was generated locally using an open-weight language model. Always double-check safety guidelines before applying homemade pesticides or consuming wild plants."
