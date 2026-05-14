from typing import List, Optional

from pydantic import BaseModel


class CardCreate(BaseModel):
    column_id: int
    title: str
    details: str
    position: int = 0


class CardUpdate(BaseModel):
    title: Optional[str] = None
    details: Optional[str] = None
    column_id: Optional[int] = None
    position: Optional[int] = None


class ColumnCreate(BaseModel):
    board_id: int
    name: str
    position: int = 0


class ColumnUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[int] = None


class CardOrderItem(BaseModel):
    id: int
    column_id: int
    position: int


class CardReorder(BaseModel):
    cards: List[CardOrderItem]


class CardOut(BaseModel):
    id: int
    column_id: int
    title: str
    details: str
    position: int
    created_at: str


class ColumnOut(BaseModel):
    id: int
    board_id: int
    name: str
    position: int
    created_at: str
    cards: List[CardOut]


class BoardOut(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: str
    columns: List[ColumnOut]
