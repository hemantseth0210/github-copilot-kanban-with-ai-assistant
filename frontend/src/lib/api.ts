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

function normalizeBoard(board: ApiBoard): BoardState {
  const cards = board.columns.flatMap((column) => column.cards.map(normalizeCard));
  return {
    columns: board.columns
      .map(normalizeColumn)
      .sort((a, b) => a.position - b.position),
    cards: Object.fromEntries(cards.map((card) => [card.id, card])),
  };
}

async function handleJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  return response.json();
}

export async function fetchBoard(): Promise<BoardState> {
  const response = await fetch("/api/board");
  const json = await handleJsonResponse<ApiBoard>(response);
  return normalizeBoard(json);
}

export async function createCard(
  columnId: number,
  title: string,
  details: string,
  position: number,
): Promise<Card> {
  const response = await fetch("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ column_id: columnId, title, details, position }),
  });
  const json = await handleJsonResponse<ApiCard>(response);
  return normalizeCard(json);
}

export async function deleteCard(cardId: number): Promise<void> {
  const response = await fetch(`/api/cards/${cardId}`, {
    method: "DELETE",
  });
  await handleJsonResponse(response);
}

export async function updateColumn(
  columnId: number,
  name: string,
  position: number,
): Promise<void> {
  const response = await fetch(`/api/columns/${columnId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, position }),
  });
  await handleJsonResponse(response);
}

export async function reorderCards(
  cards: Array<{ id: number; column_id: number; position: number }>,
): Promise<void> {
  const response = await fetch("/api/cards/reorder", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cards }),
  });
  await handleJsonResponse(response);
}
