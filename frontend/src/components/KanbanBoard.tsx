"use client";

import {
  closestCorners,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2, LogOut } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  addCard,
  BoardState,
  Card,
  Column,
  deleteCard,
  findCardColumn,
  moveCard,
  renameColumn,
} from "@/lib/board";
import {
  createCard as createCardApi,
  deleteCard as deleteCardApi,
  fetchBoard,
  reorderCards,
  updateColumn,
} from "@/lib/api";

type Drafts = Record<string, { title: string; details: string }>;

type CardPositionUpdate = {
  id: number;
  column_id: number;
  position: number;
};

function buildDrafts(columns: Column[]): Drafts {
  return Object.fromEntries(
    columns.map((column) => [column.id, { title: "", details: "" }]),
  );
}

function buildCardPositionUpdates(
  currentBoard: BoardState,
  updatedBoard: BoardState,
  movedCardId: string,
): CardPositionUpdate[] {
  const sourceColumnBefore = findCardColumn(currentBoard, movedCardId);
  const destinationColumnAfter = findCardColumn(updatedBoard, movedCardId);

  if (!sourceColumnBefore || !destinationColumnAfter) {
    return [];
  }

  if (sourceColumnBefore.id === destinationColumnAfter.id) {
    return destinationColumnAfter.cardIds.map((cardId, index) => ({
      id: Number(cardId),
      column_id: Number(destinationColumnAfter.id),
      position: index,
    }));
  }

  const sourceColumnAfter = updatedBoard.columns.find(
    (column) => column.id === sourceColumnBefore.id,
  );

  const updates: CardPositionUpdate[] = [];

  if (sourceColumnAfter) {
    sourceColumnAfter.cardIds.forEach((cardId, index) => {
      updates.push({
        id: Number(cardId),
        column_id: Number(sourceColumnAfter.id),
        position: index,
      });
    });
  }

  destinationColumnAfter.cardIds.forEach((cardId, index) => {
    updates.push({
      id: Number(cardId),
      column_id: Number(destinationColumnAfter.id),
      position: index,
    });
  });

  return updates;
}

export function KanbanBoard() {
  const { logout } = useAuth();
  const [board, setBoard] = useState<BoardState | null>(null);
  const [drafts, setDrafts] = useState<Drafts>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const cardCount = useMemo(
    () => (board ? Object.keys(board.cards).length : 0),
    [board],
  );

  useEffect(() => {
    async function loadBoard() {
      try {
        const fetchedBoard = await fetchBoard();
        setBoard(fetchedBoard);
        setDrafts(buildDrafts(fetchedBoard.columns));
      } catch {
        setError("Unable to load the board. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadBoard();
  }, []);

  async function handleAddCard(event: FormEvent<HTMLFormElement>, columnId: string) {
    event.preventDefault();

    if (!board) {
      return;
    }

    const draft = drafts[columnId];
    if (!draft?.title.trim() || !draft?.details.trim()) {
      return;
    }

    const column = board.columns.find((column) => column.id === columnId);
    if (!column) {
      return;
    }

    try {
      const card = await createCardApi(
        Number(columnId),
        draft.title,
        draft.details,
        column.cardIds.length,
      );

      const cardId = String(card.id);
      setBoard((current) =>
        current
          ? {
              ...current,
              columns: current.columns.map((existing) =>
                existing.id === columnId
                  ? { ...existing, cardIds: [...existing.cardIds, cardId] }
                  : existing,
              ),
              cards: {
                ...current.cards,
                [cardId]: card,
              },
            }
          : current,
      );
      setDrafts((current) => ({
        ...current,
        [columnId]: {
          title: "",
          details: "",
        },
      }));
    } catch {
      setError("Unable to add the card. Please try again.");
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!board) {
      return;
    }

    try {
      await deleteCardApi(Number(cardId));
      setBoard((current) =>
        current
          ? {
              ...current,
              columns: current.columns.map((column) => ({
                ...column,
                cardIds: column.cardIds.filter((id) => id !== cardId),
              })),
              cards: Object.fromEntries(
                Object.entries(current.cards).filter(([id]) => id !== cardId),
              ),
            }
          : current,
      );
    } catch {
      setError("Unable to delete the card. Please try again.");
    }
  }

  async function handleRename(title: string, columnId: string) {
    if (!board) {
      return;
    }

    const column = board.columns.find((item) => item.id === columnId);
    if (!column || !title.trim()) {
      return;
    }

    try {
      await updateColumn(Number(columnId), title.trim(), column.position);
      setBoard((current) =>
        current
          ? {
              ...current,
              columns: current.columns.map((existing) =>
                existing.id === columnId
                  ? { ...existing, title: title.trim() }
                  : existing,
              ),
            }
          : current,
      );
    } catch {
      setError("Unable to rename the column. Please try again.");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (!board) {
      return;
    }

    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    const overColumn = board.columns.find((column) => column.id === overId);

    const updatedBoard = overColumn
      ? moveCard(board, activeId, overColumn.id)
      : (() => {
          const targetColumn = findCardColumn(board, overId);
          if (!targetColumn) {
            return board;
          }
          return moveCard(
            board,
            activeId,
            targetColumn.id,
            targetColumn.cardIds.indexOf(overId),
          );
        })();

    if (updatedBoard === board) {
      return;
    }

    const payload = buildCardPositionUpdates(board, updatedBoard, activeId);

    try {
      await reorderCards(payload);
      setBoard(updatedBoard);
    } catch {
      setError("Unable to update card order. Please try again.");
    }
  }

  if (isLoading) {
    return <main className="app-shell">Loading board…</main>;
  }

  if (error) {
    return <main className="app-shell">{error}</main>;
  }

  if (!board) {
    return <main className="app-shell">No board found.</main>;
  }

  return (
    <main className="app-shell">
      <section className="board-header" aria-labelledby="board-title">
        <div>
          <p className="eyebrow">Single board workspace</p>
          <h1 id="board-title">Launch Kanban</h1>
          <p className="board-summary">
            Five focused lanes, {cardCount} active cards, and just enough motion
            to keep work moving.
          </p>
        </div>
        <div className="board-header-right">
          <div className="board-metric" aria-label={`${cardCount} cards total`}>
            <span>{cardCount}</span>
            <small>Cards</small>
          </div>
          <button
            className="logout-button"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      <DndContext
        id="launch-kanban-dnd"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <section className="board" aria-label="Kanban board">
          {board.columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              cards={column.cardIds.map((cardId) => board.cards[cardId])}
              draft={drafts[column.id] ?? { title: "", details: "" }}
              onDraftChange={(draft) =>
                setDrafts((current) => ({
                  ...current,
                  [column.id]: draft,
                }))
              }
              onAddCard={(event) => handleAddCard(event, column.id)}
              onDeleteCard={handleDeleteCard}
              onRename={(title) => handleRename(title, column.id)}
            />
          ))}
        </section>
      </DndContext>
    </main>
  );
}

type ColumnProps = {
  column: Column;
  cards: Card[];
  draft: { title: string; details: string };
  onDraftChange: (draft: { title: string; details: string }) => void;
  onAddCard: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteCard: (cardId: string) => void;
  onRename: (title: string) => void;
};

function KanbanColumn({
  column,
  cards,
  draft,
  onDraftChange,
  onAddCard,
  onDeleteCard,
  onRename,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });
  const [title, setTitle] = useState(column.title);

  useEffect(() => {
    setTitle(column.title);
  }, [column.title]);

  return (
    <article
      className={`column ${isOver ? "column-over" : ""}`}
      ref={setNodeRef}
      data-testid={`column-${column.id}`}
    >
      <header className="column-header">
        <input
          aria-label={`Rename ${column.title} column`}
          className="column-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => onRename(title)}
        />
        <span className="card-count">{cards.length}</span>
      </header>

      <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
        <div className="card-list">
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} onDelete={onDeleteCard} />
          ))}
        </div>
      </SortableContext>

      <form className="add-card" onSubmit={onAddCard} aria-label={`Add card to ${column.title}`}>
        <input
          aria-label={`New ${column.title} card title`}
          placeholder="Card title"
          value={draft.title}
          onChange={(event) =>
            onDraftChange({
              ...draft,
              title: event.target.value,
            })
          }
        />
        <textarea
          aria-label={`New ${column.title} card details`}
          placeholder="Details"
          rows={3}
          value={draft.details}
          onChange={(event) =>
            onDraftChange({
              ...draft,
              details: event.target.value,
            })
          }
        />
        <button type="submit">
          <Plus size={16} aria-hidden="true" />
          Add card
        </button>
      </form>
    </article>
  );
}

function KanbanCard({
  card,
  onDelete,
}: {
  card: Card;
  onDelete: (cardId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: card.id,
    });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      className={`task-card ${isDragging ? "task-card-dragging" : ""}`}
      ref={setNodeRef}
      style={style}
      data-testid={`card-${card.id}`}
    >
      <button className="drag-handle" type="button" {...attributes} {...listeners}>
        <span aria-hidden="true" />
        <span className="sr-only">Move {card.title}</span>
      </button>
      <div className="task-content">
        <h2>{card.title}</h2>
        <p>{card.details}</p>
      </div>
      <button
        className="delete-card"
        type="button"
        aria-label={`Delete ${card.title}`}
        onClick={() => onDelete(card.id)}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </article>
  );
}
