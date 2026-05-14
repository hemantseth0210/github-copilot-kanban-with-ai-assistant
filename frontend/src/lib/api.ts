import { BoardState, Card, Column } from "./board";

export type ApiCard = {
  id: number;
  column_id: number;
  title: string;
  details: string;
  position: number;
  created_at: string;
};

export type ApiColumn = {
  id: number;
  board_id: number;
  name: string;
  position: number;
  created_at: string;
  cards: ApiCard[];
};

export type ApiBoard = {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  columns: ApiColumn[];
};

function normalizeCard(card: ApiCard): Card {
  return {
    id: String(card.id),
    title: card.title,
    details: card.details,
  };
}

function normalizeColumn(column: ApiColumn): Column {
  return {
    id: String(column.id),
    title: column.name,
    cardIds: column.cards.map((card) => String(card.id)),
    position: column.position,
  };
}

export function normalizeBoard(board: ApiBoard): BoardState {
  const cards = board.columns.flatMap((column) => column.cards.map(normalizeCard));
  return {
    columns: board.columns
      .map(normalizeColumn)
      .sort((a, b) => a.position - b.position),
    cards: Object.fromEntries(cards.map((card) => [card.id, card])),
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

function resolveApiPath(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function handleJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorText = `API request failed with status ${response.status}`;

    try {
      const body = await response.json();
      if (body?.detail) {
        errorText = `API request failed: ${body.detail}`;
      } else if (body?.message) {
        errorText = `API request failed: ${body.message}`;
      }
    } catch {
      // ignore parse errors
    }

    throw new Error(errorText);
  }

  return response.json();
}

export async function fetchBoard(): Promise<BoardState> {
  const response = await fetch(resolveApiPath("/api/board"));
  const json = await handleJsonResponse<ApiBoard>(response);
  return normalizeBoard(json);
}

export async function createCard(
  columnId: number,
  title: string,
  details: string,
  position: number,
): Promise<Card> {
  const response = await fetch(resolveApiPath("/api/cards"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ column_id: columnId, title, details, position }),
  });
  const json = await handleJsonResponse<ApiCard>(response);
  return normalizeCard(json);
}

export async function deleteCard(cardId: number): Promise<void> {
  const response = await fetch(resolveApiPath(`/api/cards/${cardId}`), {
    method: "DELETE",
  });
  await handleJsonResponse(response);
}

export async function updateColumn(
  columnId: number,
  name: string,
  position: number,
): Promise<void> {
  const response = await fetch(resolveApiPath(`/api/columns/${columnId}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, position }),
  });
  await handleJsonResponse(response);
}

export async function reorderCards(
  cards: Array<{ id: number; column_id: number; position: number }>,
): Promise<void> {
  const response = await fetch(resolveApiPath("/api/cards/reorder"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cards }),
  });
  await handleJsonResponse(response);
}

export async function askAi(
  prompt: string,
  model = "openai/gpt-4o-mini",
): Promise<string> {
  const response = await fetch(resolveApiPath("/api/ai/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model }),
  });
  const json = await handleJsonResponse<{ response: string }>(response);
  return json.response;
}

export async function updateBoardWithAi(
  prompt: string,
  model = "openai/gpt-4o-mini",
): Promise<{ response: string; board: ApiBoard }> {
  const response = await fetch(resolveApiPath("/api/ai/kanban"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model }),
  });
  const json = await handleJsonResponse<{ response: string; changes: unknown; board: ApiBoard }>(response);
  return { response: json.response, board: json.board };
}
