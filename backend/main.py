from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

try:
    from backend.db import (
        apply_kanban_changes,
        create_card,
        create_column,
        create_connection,
        delete_card,
        delete_column,
        get_board,
        get_card,
        get_column,
        update_card,
        update_column,
        update_card_positions,
    )
    from backend.schemas import (
        BoardOut,
        CardCreate,
        CardUpdate,
        CardReorder,
        ColumnCreate,
        ColumnUpdate,
    )
    from backend.ai import check_ai_connectivity, call_ai, call_ai_with_board, parse_kanban_changes
except ImportError:
    from db import (
        apply_kanban_changes,
        create_card,
        create_column,
        create_connection,
        delete_card,
        delete_column,
        get_board,
        get_card,
        get_column,
        update_card,
        update_column,
        update_card_positions,
    )
    from schemas import (
        BoardOut,
        CardCreate,
        CardUpdate,
        CardReorder,
        ColumnCreate,
        ColumnUpdate,
    )
    from ai import check_ai_connectivity, call_ai, call_ai_with_board, parse_kanban_changes


class ChatRequest(BaseModel):
    prompt: str
    model: str = "openai/gpt-4o-mini"


class AiKanbanRequest(BaseModel):
    prompt: str
    model: str = "openai/gpt-4o-mini"

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI()
db_connection = create_connection()

@app.get("/api/test")
def test_api():
    return {"message": "API is working!"}

@app.get("/api/ai/test")
async def test_ai_connectivity_endpoint():
    response = await check_ai_connectivity()
    return {"response": response}

@app.post("/api/ai/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        response = await call_ai(request.prompt, request.model)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    return {"response": response}

@app.post("/api/ai/kanban")
async def ai_kanban_update(request: AiKanbanRequest):
    board = get_board(db_connection)
    if board is None:
        raise HTTPException(status_code=404, detail="Board not found")

    try:
        ai_response = await call_ai_with_board(request.prompt, board, request.model)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    try:
        changes = parse_kanban_changes(ai_response)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    applied = apply_kanban_changes(db_connection, changes)
    updated_board = get_board(db_connection)
    return {"response": ai_response, "changes": applied, "board": updated_board}

@app.get("/api/board", response_model=BoardOut)
def read_board():
    board = get_board(db_connection)
    if board is None:
        raise HTTPException(status_code=404, detail="Board not found")
    return board

@app.post("/api/columns")
def add_column(payload: ColumnCreate):
    return create_column(db_connection, payload.board_id, payload.name, payload.position)

@app.put("/api/columns/{column_id}")
def edit_column(column_id: int, payload: ColumnUpdate):
    column = update_column(db_connection, column_id, payload.name, payload.position)
    if column is None:
        raise HTTPException(status_code=404, detail="Column not found")
    return column

@app.delete("/api/columns/{column_id}")
def remove_column(column_id: int):
    column = get_column(db_connection, column_id)
    if column is None:
        raise HTTPException(status_code=404, detail="Column not found")
    delete_column(db_connection, column_id)
    return {"message": "Column deleted"}

@app.post("/api/cards")
def add_card(payload: CardCreate):
    return create_card(db_connection, payload.column_id, payload.title, payload.details, payload.position)

@app.put("/api/cards/reorder")
def reorder_cards(payload: CardReorder):
    updated_cards = update_card_positions(db_connection, [
        {"id": item.id, "column_id": item.column_id, "position": item.position}
        for item in payload.cards
    ])
    return updated_cards

@app.put("/api/cards/{card_id}")
def edit_card(card_id: int, payload: CardUpdate):
    card = update_card(
        db_connection,
        card_id,
        title=payload.title,
        details=payload.details,
        column_id=payload.column_id,
        position=payload.position,
    )
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return card

@app.delete("/api/cards/{card_id}")
def remove_card(card_id: int):
    card = get_card(db_connection, card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    delete_card(db_connection, card_id)
    return {"message": "Card deleted"}

@app.get("/")
def read_root():
    return FileResponse(STATIC_DIR / "index.html")

@app.get("/{path:path}")
def serve_frontend(path: str):
    requested_file = STATIC_DIR / path
    if requested_file.exists() and requested_file.is_file():
        return FileResponse(requested_file)
    return FileResponse(STATIC_DIR / "index.html")
