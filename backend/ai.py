import httpx
import json
import os
import re
from typing import Any, Dict, Optional


def get_openrouter_api_key() -> str:
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        raise ValueError("OPENROUTER_API_KEY environment variable is not set")
    return key


async def call_ai(prompt: str, model: str = "openai/gpt-4o-mini") -> str:
    """
    Call the OpenRouter AI API with the given prompt.
    Returns the AI response text.
    """

    api_key = get_openrouter_api_key()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Launch Kanban",
    }

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as exc:
            body = None
            try:
                body = exc.response.json()
            except ValueError:
                body = exc.response.text
            raise RuntimeError(
                f"OpenRouter API error {exc.response.status_code}: {body}"
            ) from exc
        except httpx.RequestError as exc:
            raise RuntimeError(f"OpenRouter request failed: {exc}") from exc

    if "choices" not in data or len(data["choices"]) == 0:
        raise ValueError("Invalid response from OpenRouter API")

    return data["choices"][0]["message"]["content"]


def build_kanban_prompt(user_prompt: str, board: Dict[str, Any]) -> str:
    board_json = json.dumps(board, indent=2)
    return (
        "You are an AI assistant for a Kanban board. Only respond with valid JSON. "
        "Do not add any explanation or markdown. The JSON must define any changes "
        "to the board in the response."
        "\n\nBoard JSON:\n"
        f"{board_json}\n\n"
        "User request: "
        f"{user_prompt}\n\n"
        "Return an object with optional fields: \n"
        "- column_updates: [{id, name?, position?}]\n"
        "- card_updates: [{id, title?, details?, column_id?, position?}]\n"
        "- new_cards: [{column_id, title, details, position?}]\n"
        "If there are no changes, return { } or an empty object."
    )


def extract_json_object(response_text: str) -> str:
    trimmed = response_text.strip()
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", trimmed)
    if fenced:
        trimmed = fenced.group(1).strip()

    start = trimmed.find("{")
    end = trimmed.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("AI response did not contain JSON")
    return trimmed[start : end + 1]


def parse_kanban_changes(response_text: str) -> Dict[str, Any]:
    json_text = extract_json_object(response_text)
    changes = json.loads(json_text)
    if not isinstance(changes, dict):
        raise ValueError("AI response must be a JSON object")

    for key in ["column_updates", "card_updates", "new_cards"]:
        if key in changes and not isinstance(changes[key], list):
            raise ValueError(f"AI response field {key} must be a list")

    return changes


async def call_ai_with_board(
    prompt: str,
    board: Dict[str, Any],
    model: str = "openai/gpt-4o-mini",
) -> str:
    ai_prompt = build_kanban_prompt(prompt, board)
    return await call_ai(ai_prompt, model)


async def check_ai_connectivity() -> str:
    """
    Simple test to verify AI connectivity by asking for a math answer.
    """
    return await call_ai("What is 2 + 2? Answer with just the number.")
