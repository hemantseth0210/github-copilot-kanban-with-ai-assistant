import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DB_PATH = BASE_DIR / "data" / "kanban.db"

CREATE_TABLE_SQL = """
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS columns (
    id INTEGER PRIMARY KEY,
    board_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(board_id) REFERENCES boards(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY,
    column_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(column_id) REFERENCES columns(id) ON DELETE CASCADE
);
"""

DEFAULT_BOARD = {
    "name": "Launch Kanban",
    "user_id": 1,
}

DEFAULT_COLUMNS = [
    {"name": "Backlog", "position": 0},
    {"name": "Ready", "position": 1},
    {"name": "In Progress", "position": 2},
    {"name": "Review", "position": 3},
    {"name": "Done", "position": 4},
]

DEFAULT_CARDS = [
    {"column_name": "Backlog", "title": "Sketch onboarding flow", "details": "Map the first-run board experience with clear empty states.", "position": 0},
    {"column_name": "Backlog", "title": "Define launch checklist", "details": "Capture the lean set of work needed before the MVP demo.", "position": 1},
    {"column_name": "Backlog", "title": "Collect stakeholder notes", "details": "Summarize feedback into crisp card titles and details.", "position": 2},
    {"column_name": "Ready", "title": "Refine card motion", "details": "Make drag and drop feel quick, stable, and predictable.", "position": 0},
    {"column_name": "Ready", "title": "Write board copy", "details": "Keep labels short enough to scan while the board is busy.", "position": 1},
    {"column_name": "In Progress", "title": "Build column rename", "details": "Support inline edits without adding settings screens.", "position": 0},
    {"column_name": "In Progress", "title": "Polish add-card form", "details": "Use direct controls that work smoothly on narrow screens.", "position": 1},
    {"column_name": "Review", "title": "Review color contrast", "details": "Check the required palette across headings and actions.", "position": 0},
    {"column_name": "Done", "title": "Choose project stack", "details": "Use Next.js, TypeScript, and a proven drag and drop library.", "position": 0},
    {"column_name": "Done", "title": "Seed demo data", "details": "Open directly to a credible board with realistic work.", "position": 1},
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def get_db_path() -> Path:
    configured_path = os.getenv("KANBAN_DB_PATH")
    if configured_path:
        return Path(configured_path)
    return DEFAULT_DB_PATH


def create_connection() -> sqlite3.Connection:
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    initialize_database(conn)
    return conn


def initialize_database(conn: sqlite3.Connection) -> None:
    cursor = conn.cursor()
    cursor.executescript(CREATE_TABLE_SQL)
    conn.commit()
    board_exists = cursor.execute("SELECT 1 FROM boards LIMIT 1").fetchone()
    if not board_exists:
        seed_default_data(conn)


def seed_default_data(conn: sqlite3.Connection) -> None:
    cursor = conn.cursor()
    now = utc_now()
    cursor.execute(
        "INSERT INTO boards (user_id, name, created_at) VALUES (?, ?, ?)",
        (DEFAULT_BOARD["user_id"], DEFAULT_BOARD["name"], now),
    )
    board_id = cursor.lastrowid

    column_ids = {}
    for column in DEFAULT_COLUMNS:
        cursor.execute(
            "INSERT INTO columns (board_id, name, position, created_at) VALUES (?, ?, ?, ?)",
            (board_id, column["name"], column["position"], now),
        )
        column_ids[column["name"]] = cursor.lastrowid

    for card in DEFAULT_CARDS:
        cursor.execute(
            "INSERT INTO cards (column_id, title, details, position, created_at) VALUES (?, ?, ?, ?, ?)",
            (
                column_ids[card["column_name"]],
                card["title"],
                card["details"],
                card["position"],
                now,
            ),
        )
    conn.commit()


def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    return {key: row[key] for key in row.keys()}


def get_board(conn: sqlite3.Connection) -> Optional[Dict[str, Any]]:
    board_row = conn.execute("SELECT * FROM boards ORDER BY id LIMIT 1").fetchone()
    if board_row is None:
        return None

    columns = [row_to_dict(row) for row in conn.execute(
        "SELECT * FROM columns WHERE board_id = ? ORDER BY position, id", (board_row["id"],)
    ).fetchall()]

    cards = [row_to_dict(row) for row in conn.execute(
        "SELECT * FROM cards WHERE column_id IN (SELECT id FROM columns WHERE board_id = ?) ORDER BY position, id", (board_row["id"],)
    ).fetchall()]

    cards_by_column = {}
    for card in cards:
        cards_by_column.setdefault(card["column_id"], []).append(card)

    columns_with_cards: List[Dict[str, Any]] = []
    for column in columns:
        column_data = dict(column)
        column_data["cards"] = cards_by_column.get(column["id"], [])
        columns_with_cards.append(column_data)

    board_data = row_to_dict(board_row)
    board_data["columns"] = columns_with_cards
    return board_data


def create_column(conn: sqlite3.Connection, board_id: int, name: str, position: int) -> Dict[str, Any]:
    now = utc_now()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO columns (board_id, name, position, created_at) VALUES (?, ?, ?, ?)",
        (board_id, name, position, now),
    )
    conn.commit()
    return get_column(conn, cursor.lastrowid)


def get_column(conn: sqlite3.Connection, column_id: int) -> Optional[Dict[str, Any]]:
    row = conn.execute("SELECT * FROM columns WHERE id = ?", (column_id,)).fetchone()
    return row_to_dict(row) if row else None


def update_column(conn: sqlite3.Connection, column_id: int, name: Optional[str] = None, position: Optional[int] = None) -> Optional[Dict[str, Any]]:
    if name is None and position is None:
        return get_column(conn, column_id)
    current = get_column(conn, column_id)
    if not current:
        return None
    fields: List[str] = []
    values: List[Any] = []
    if name is not None:
        fields.append("name = ?")
        values.append(name)
    if position is not None:
        fields.append("position = ?")
        values.append(position)
    values.append(column_id)
    conn.execute(f"UPDATE columns SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()
    return get_column(conn, column_id)


def delete_column(conn: sqlite3.Connection, column_id: int) -> None:
    conn.execute("DELETE FROM columns WHERE id = ?", (column_id,))
    conn.commit()


def create_card(conn: sqlite3.Connection, column_id: int, title: str, details: str, position: int) -> Dict[str, Any]:
    now = utc_now()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO cards (column_id, title, details, position, created_at) VALUES (?, ?, ?, ?, ?)",
        (column_id, title, details, position, now),
    )
    conn.commit()
    return get_card(conn, cursor.lastrowid)


def get_card(conn: sqlite3.Connection, card_id: int) -> Optional[Dict[str, Any]]:
    row = conn.execute("SELECT * FROM cards WHERE id = ?", (card_id,)).fetchone()
    return row_to_dict(row) if row else None


def update_card(
    conn: sqlite3.Connection,
    card_id: int,
    title: Optional[str] = None,
    details: Optional[str] = None,
    column_id: Optional[int] = None,
    position: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    current = get_card(conn, card_id)
    if not current:
        return None
    updates: List[str] = []
    values: List[Any] = []
    if title is not None:
        updates.append("title = ?")
        values.append(title)
    if details is not None:
        updates.append("details = ?")
        values.append(details)
    if column_id is not None:
        updates.append("column_id = ?")
        values.append(column_id)
    if position is not None:
        updates.append("position = ?")
        values.append(position)
    if not updates:
        return current
    values.append(card_id)
    conn.execute(f"UPDATE cards SET {', '.join(updates)} WHERE id = ?", values)
    conn.commit()
    return get_card(conn, card_id)


def update_card_positions(conn: sqlite3.Connection, updates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    updated_cards: List[Dict[str, Any]] = []
    for update in updates:
        card = update_card(
            conn,
            update["id"],
            column_id=update.get("column_id"),
            position=update.get("position"),
        )
        if card is not None:
            updated_cards.append(card)
    return updated_cards


def apply_kanban_changes(conn: sqlite3.Connection, changes: Dict[str, Any]) -> Dict[str, Any]:
    applied: Dict[str, Any] = {
        "column_updates": [],
        "card_updates": [],
        "new_cards": [],
    }

    for column_update in changes.get("column_updates", []):
        column_id = int(column_update["id"])
        column = update_column(
            conn,
            column_id,
            name=column_update.get("name"),
            position=column_update.get("position"),
        )
        if column is not None:
            applied["column_updates"].append(column)

    for card_update in changes.get("card_updates", []):
        card_id = int(card_update["id"])
        card = update_card(
            conn,
            card_id,
            title=card_update.get("title"),
            details=card_update.get("details"),
            column_id=card_update.get("column_id"),
            position=card_update.get("position"),
        )
        if card is not None:
            applied["card_updates"].append(card)

    for new_card in changes.get("new_cards", []):
        card = create_card(
            conn,
            int(new_card["column_id"]),
            new_card["title"],
            new_card["details"],
            new_card.get("position", 0),
        )
        applied["new_cards"].append(card)

    return applied


def delete_card(conn: sqlite3.Connection, card_id: int) -> None:
    conn.execute("DELETE FROM cards WHERE id = ?", (card_id,))
    conn.commit()
