import importlib
import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock, Mock, patch

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


def test_ai_test_endpoint(tmp_path: Path) -> None:
    """Test the AI connectivity endpoint."""
    with patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"}):
        client = build_test_client(tmp_path)
        
        mock_response = {
            "choices": [{"message": {"content": "4"}}]
        }
        
        mock_post_response = AsyncMock()
        mock_post_response.json = Mock(return_value=mock_response)
        mock_post_response.raise_for_status = Mock()
        
        mock_http_client = AsyncMock()
        mock_http_client.post = AsyncMock(return_value=mock_post_response)
        mock_http_client.__aenter__.return_value = mock_http_client
        mock_http_client.__aexit__.return_value = None
        
        with patch("httpx.AsyncClient", return_value=mock_http_client):
            response = client.get("/api/ai/test")
            assert response.status_code == 200
            assert response.json()["response"] == "4"


def test_ai_chat_endpoint(tmp_path: Path) -> None:
    """Test the AI chat endpoint."""
    with patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"}):
        client = build_test_client(tmp_path)
        
        mock_response = {
            "choices": [{"message": {"content": "This is the AI response"}}]
        }
        
        mock_post_response = AsyncMock()
        mock_post_response.json = Mock(return_value=mock_response)
        mock_post_response.raise_for_status = Mock()
        
        mock_http_client = AsyncMock()
        mock_http_client.post = AsyncMock(return_value=mock_post_response)
        mock_http_client.__aenter__.return_value = mock_http_client
        mock_http_client.__aexit__.return_value = None
        
        with patch("httpx.AsyncClient", return_value=mock_http_client):
            response = client.post(
                "/api/ai/chat",
                json={"prompt": "Tell me a joke"}
            )
            assert response.status_code == 200
            assert response.json()["response"] == "This is the AI response"


def test_ai_kanban_endpoint_applies_changes(tmp_path: Path) -> None:
    with patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"}):
        client = build_test_client(tmp_path)
        board_data = client.get("/api/board").json()
        backlog = next(column for column in board_data["columns"] if column["name"] == "Backlog")
        ready_column = next(column for column in board_data["columns"] if column["name"] == "Ready")
        card_id = backlog["cards"][0]["id"]

        ai_response = '{"card_updates":[{"id":%d,"column_id":%d,"position":0}]}' % (card_id, ready_column["id"])

        with patch("backend.main.call_ai_with_board", AsyncMock(return_value=ai_response)):
            response = client.post(
                "/api/ai/kanban",
                json={"prompt": "Move one card to Ready","model": "openai/gpt-oss-120b"},
            )
            assert response.status_code == 200

            data = response.json()
            assert data["changes"]["card_updates"][0]["id"] == card_id
            assert data["board"]["columns"]

            updated_ready = next(column for column in data["board"]["columns"] if column["name"] == "Ready")
            assert any(card["id"] == card_id for card in updated_ready["cards"])
