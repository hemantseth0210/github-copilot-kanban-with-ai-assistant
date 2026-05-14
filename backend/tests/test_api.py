import importlib
import os
import sys
from pathlib import Path

from fastapi.testclient import TestClient


def build_test_client(tmp_path: Path) -> TestClient:
    os.environ["KANBAN_DB_PATH"] = str(tmp_path / "test_kanban.db")
    if "backend.db" in sys.modules:
        importlib.reload(sys.modules["backend.db"])
    if "backend.main" in sys.modules:
        importlib.reload(sys.modules["backend.main"])
    app = importlib.import_module("backend.main").app
    return TestClient(app)


def test_api_test_endpoint(tmp_path: Path) -> None:
    client = build_test_client(tmp_path)
    response = client.get("/api/test")
    assert response.status_code == 200
    assert response.json() == {"message": "API is working!"}


def test_board_endpoint_returns_board_data(tmp_path: Path) -> None:
    client = build_test_client(tmp_path)
    response = client.get("/api/board")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Launch Kanban"
    assert isinstance(data["columns"], list)
    assert len(data["columns"]) >= 5
    assert any(column["name"] == "Backlog" for column in data["columns"])


def test_create_update_delete_column(tmp_path: Path) -> None:
    client = build_test_client(tmp_path)
    board_response = client.get("/api/board")
    board_id = board_response.json()["id"]

    create_response = client.post("/api/columns", json={
        "board_id": board_id,
        "name": "QA",
        "position": 5,
    })
    assert create_response.status_code == 200
    column = create_response.json()
    assert column["name"] == "QA"

    update_response = client.put(f"/api/columns/{column['id']}", json={"name": "Quality Assurance", "position": 5})
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Quality Assurance"

    delete_response = client.delete(f"/api/columns/{column['id']}")
    assert delete_response.status_code == 200
    assert delete_response.json() == {"message": "Column deleted"}


def test_create_update_delete_card(tmp_path: Path) -> None:
    client = build_test_client(tmp_path)
    board_response = client.get("/api/board")
    board_data = board_response.json()
    backlog = next(column for column in board_data["columns"] if column["name"] == "Backlog")

    create_response = client.post("/api/cards", json={
        "column_id": backlog["id"],
        "title": "Test card",
        "details": "Card details",
        "position": 99,
    })
    assert create_response.status_code == 200
    card = create_response.json()
    assert card["title"] == "Test card"

    update_response = client.put(f"/api/cards/{card['id']}", json={"title": "Updated card", "position": 0})
    assert update_response.status_code == 200
    assert update_response.json()["title"] == "Updated card"

    delete_response = client.delete(f"/api/cards/{card['id']}")
    assert delete_response.status_code == 200
    assert delete_response.json() == {"message": "Card deleted"}


def test_database_created_if_missing(tmp_path: Path) -> None:
    db_file = tmp_path / "missing.db"
    if db_file.exists():
        db_file.unlink()
    assert not db_file.exists()

    os.environ["KANBAN_DB_PATH"] = str(db_file)
    importlib.reload(importlib.import_module("backend.db"))
    importlib.reload(importlib.import_module("backend.main"))

    client = TestClient(importlib.import_module("backend.main").app)
    assert db_file.exists()
    response = client.get("/api/board")
    assert response.status_code == 200
    assert response.json()["name"] == "Launch Kanban"


def test_reorder_cards_updates_positions(tmp_path: Path) -> None:
    client = build_test_client(tmp_path)
    board_response = client.get("/api/board")
    board_data = board_response.json()
    backlog = next(column for column in board_data["columns"] if column["name"] == "Backlog")
    assert len(backlog["cards"]) >= 2

    first_card_id = backlog["cards"][0]["id"]
    second_card_id = backlog["cards"][1]["id"]

    reorder_response = client.put(
        "/api/cards/reorder",
        json={
            "cards": [
                {"id": first_card_id, "column_id": backlog["id"], "position": 1},
                {"id": second_card_id, "column_id": backlog["id"], "position": 0},
            ],
        },
    )
    assert reorder_response.status_code == 200

    refreshed_board = client.get("/api/board").json()
    refreshed_backlog = next(column for column in refreshed_board["columns"] if column["name"] == "Backlog")
    assert refreshed_backlog["cards"][0]["id"] == second_card_id
    assert refreshed_backlog["cards"][1]["id"] == first_card_id
