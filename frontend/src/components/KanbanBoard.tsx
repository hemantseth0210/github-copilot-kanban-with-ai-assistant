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
import { FormEvent, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  addCard,
  BoardState,
  Card,
  Column,
  deleteCard,
  findCardColumn,
  initialBoard,
  moveCard,
  renameColumn,
} from "@/lib/board";

type Drafts = Record<string, { title: string; details: string }>;

export function KanbanBoard() {
  const { logout } = useAuth();
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [drafts, setDrafts] = useState<Drafts>(() =>
    Object.fromEntries(
      initialBoard.columns.map((column) => [
        column.id,
        {
          title: "",
          details: "",
        },
      ]),
    ),
  );
  const nextCardNumber = useRef(11);
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
  const cardCount = useMemo(() => Object.keys(board.cards).length, [board.cards]);

  function handleAddCard(event: FormEvent<HTMLFormElement>, columnId: string) {
    event.preventDefault();

    const draft = drafts[columnId];
    const id = `card-${nextCardNumber.current}`;
    nextCardNumber.current += 1;

    setBoard((current) =>
      addCard(current, columnId, {
        id,
        title: draft.title,
        details: draft.details,
      }),
    );
    setDrafts((current) => ({
      ...current,
      [columnId]: {
        title: "",
        details: "",
      },
    }));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setBoard((current) => {
      const activeId = String(active.id);
      const overId = String(over.id);
      const overColumn = current.columns.find((column) => column.id === overId);

      if (overColumn) {
        return moveCard(current, activeId, overColumn.id);
      }

      const targetColumn = findCardColumn(current, overId);

      if (!targetColumn) {
        return current;
      }

      return moveCard(
        current,
        activeId,
        targetColumn.id,
        targetColumn.cardIds.indexOf(overId),
      );
    });
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
              draft={drafts[column.id]}
              onDraftChange={(draft) =>
                setDrafts((current) => ({
                  ...current,
                  [column.id]: draft,
                }))
              }
              onAddCard={(event) => handleAddCard(event, column.id)}
              onDeleteCard={(cardId) =>
                setBoard((current) => deleteCard(current, cardId))
              }
              onRename={(title) =>
                setBoard((current) => renameColumn(current, column.id, title))
              }
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
          value={column.title}
          onChange={(event) => onRename(event.target.value)}
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
