import os
import sys
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, Mock, patch

sys.path.insert(0, str(Path(__file__).parent.parent.resolve()))

from ai import call_ai, check_ai_connectivity, get_openrouter_api_key


def test_get_openrouter_api_key() -> None:
    """Test that the API key can be retrieved from environment."""
    with patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key-123"}):
        key = get_openrouter_api_key()
        assert key == "test-key-123"


def test_get_openrouter_api_key_missing() -> None:
    """Test that an error is raised when API key is missing."""
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(ValueError, match="OPENROUTER_API_KEY environment variable is not set"):
            get_openrouter_api_key()


@pytest.mark.asyncio
async def test_call_ai_success() -> None:
    """Test a successful AI call."""
    mock_response = {
        "choices": [
            {
                "message": {
                    "content": "The answer is 4",
                }
            }
        ]
    }

    mock_post_response = AsyncMock()
    mock_post_response.json = Mock(return_value=mock_response)
    mock_post_response.raise_for_status = Mock()

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_post_response)
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None

    with patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"}):
        with patch("ai.httpx.AsyncClient", return_value=mock_client):
            response = await call_ai("What is 2 + 2?")
            assert response == "The answer is 4"
            mock_client.post.assert_called_once()


@pytest.mark.asyncio
async def test_call_ai_default_model() -> None:
    """Test that the default model is openai/gpt-4o-mini."""
    mock_response = {"choices": [{"message": {"content": "test response"}}]}

    mock_post_response = AsyncMock()
    mock_post_response.json = Mock(return_value=mock_response)
    mock_post_response.raise_for_status = Mock()

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_post_response)
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None

    with patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"}):
        with patch("httpx.AsyncClient", return_value=mock_client):
            await call_ai("test prompt")
            call_args = mock_client.post.call_args
            payload = call_args.kwargs["json"]
            assert payload["model"] == "openai/gpt-4o-mini"


@pytest.mark.asyncio
async def test_call_ai_custom_model() -> None:
    """Test that a custom model can be specified."""
    mock_response = {"choices": [{"message": {"content": "test response"}}]}

    mock_post_response = AsyncMock()
    mock_post_response.json = Mock(return_value=mock_response)
    mock_post_response.raise_for_status = Mock()

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_post_response)
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None

    with patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"}):
        with patch("httpx.AsyncClient", return_value=mock_client):
            await call_ai("test prompt", model="custom/model")
            call_args = mock_client.post.call_args
            payload = call_args.kwargs["json"]
            assert payload["model"] == "custom/model"


@pytest.mark.asyncio
async def test_test_ai_connectivity() -> None:
    """Test the connectivity check."""
    mock_response = {"choices": [{"message": {"content": "4"}}]}

    mock_post_response = AsyncMock()
    mock_post_response.json = Mock(return_value=mock_response)
    mock_post_response.raise_for_status = Mock()

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_post_response)
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None

    with patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-key"}):
        with patch("httpx.AsyncClient", return_value=mock_client):
            response = await check_ai_connectivity()
            assert response == "4"
