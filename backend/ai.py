import httpx
import os
from typing import Optional


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
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=30.0,
        )
        response.raise_for_status()
        data = response.json()

    if "choices" not in data or len(data["choices"]) == 0:
        raise ValueError("Invalid response from OpenRouter API")

    return data["choices"][0]["message"]["content"]


async def check_ai_connectivity() -> str:
    """
    Simple test to verify AI connectivity by asking for a math answer.
    """
    return await call_ai("What is 2 + 2? Answer with just the number.")
