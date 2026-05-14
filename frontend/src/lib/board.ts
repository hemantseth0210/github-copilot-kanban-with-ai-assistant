export type Card = {
  id: string;
  title: string;
  details: string;
};

export type Column = {
  id: string;
  title: string;
  cardIds: string[];
  position: number;
};

export type BoardState = {
  columns: Column[];
  cards: Record<string, Card>;
};

export const initialBoard: BoardState = {
  columns: [
    {
      id: "backlog",
      title: "Backlog",
      cardIds: ["card-1", "card-2", "card-3"],
      position: 0,
    },
    {
      id: "ready",
      title: "Ready",
      cardIds: ["card-4", "card-5"],
      position: 1,
    },
    {
      id: "doing",
      title: "In Progress",
      cardIds: ["card-6", "card-7"],
      position: 2,
    },
    {
      id: "review",
      title: "Review",
      cardIds: ["card-8"],
      position: 3,
    },
    {
      id: "done",
      title: "Done",
      cardIds: ["card-9", "card-10"],
      position: 4,
    },
  ],
  cards: {
    "card-1": {
      id: "card-1",
      title: "Sketch onboarding flow",
      details: "Map the first-run board experience with clear empty states.",
    },
    "card-2": {
      id: "card-2",
      title: "Define launch checklist",
      details: "Capture the lean set of work needed before the MVP demo.",
    },
    "card-3": {
      id: "card-3",
      title: "Collect stakeholder notes",
      details: "Summarize feedback into crisp card titles and details.",
    },
    "card-4": {
      id: "card-4",
      title: "Refine card motion",
      details: "Make drag and drop feel quick, stable, and predictable.",
    },
    "card-5": {
      id: "card-5",
      title: "Write board copy",
      details: "Keep labels short enough to scan while the board is busy.",
    },
    "card-6": {
      id: "card-6",
      title: "Build column rename",
      details: "Support inline edits without adding settings screens.",
    },
    "card-7": {
      id: "card-7",
      title: "Polish add-card form",
      details: "Use direct controls that work smoothly on narrow screens.",
    },
    "card-8": {
      id: "card-8",
      title: "Review color contrast",
      details: "Check the required palette across headings and actions.",
    },
    "card-9": {
      id: "card-9",
      title: "Choose project stack",
      details: "Use Next.js, TypeScript, and a proven drag and drop library.",
    },
    "card-10": {
      id: "card-10",
      title: "Seed demo data",
      details: "Open directly to a credible board with realistic work.",
    },
  },
};

export function renameColumn(
  board: BoardState,
  columnId: string,
  title: string,
): BoardState {
  const nextTitle = title.trim();

  if (!nextTitle) {
    return board;
  }

  return {
    ...board,
    columns: board.columns.map((column) =>
      column.id === columnId ? { ...column, title: nextTitle } : column,
    ),
  };
}

export function addCard(
  board: BoardState,
  columnId: string,
  card: Card,
): BoardState {
  const title = card.title.trim();
  const details = card.details.trim();

  if (!title || !details) {
    return board;
  }

  return {
    ...board,
    columns: board.columns.map((column) =>
      column.id === columnId
        ? { ...column, cardIds: [...column.cardIds, card.id] }
        : column,
    ),
    cards: {
      ...board.cards,
      [card.id]: {
        ...card,
        title,
        details,
      },
    },
  };
}

export function deleteCard(board: BoardState, cardId: string): BoardState {
  const cards = { ...board.cards };
  delete cards[cardId];

  return {
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      cardIds: column.cardIds.filter((id) => id !== cardId),
    })),
    cards,
  };
}

export function findCardColumn(
  board: BoardState,
  cardId: string,
): Column | undefined {
  return board.columns.find((column) => column.cardIds.includes(cardId));
}

export function moveCard(
  board: BoardState,
  cardId: string,
  targetColumnId: string,
  targetIndex?: number,
): BoardState {
  const sourceColumn = findCardColumn(board, cardId);
  const targetColumn = board.columns.find((column) => column.id === targetColumnId);

  if (!sourceColumn || !targetColumn) {
    return board;
  }

  const sourceCardIds = sourceColumn.cardIds.filter((id) => id !== cardId);
  const destinationIds =
    sourceColumn.id === targetColumn.id ? sourceCardIds : [...targetColumn.cardIds];
  const insertAt = Math.max(
    0,
    Math.min(targetIndex ?? destinationIds.length, destinationIds.length),
  );
  const nextDestinationIds = [
    ...destinationIds.slice(0, insertAt),
    cardId,
    ...destinationIds.slice(insertAt),
  ];

  return {
    ...board,
    columns: board.columns.map((column) => {
      if (column.id === sourceColumn.id && column.id === targetColumn.id) {
        return { ...column, cardIds: nextDestinationIds };
      }

      if (column.id === sourceColumn.id) {
        return { ...column, cardIds: sourceCardIds };
      }

      if (column.id === targetColumn.id) {
        return { ...column, cardIds: nextDestinationIds };
      }

      return column;
    }),
  };
}
