# AGENTS.md

## Overview
This file documents the structure and logic of the Kanban MVP frontend, located in the `frontend/` directory.

---

## Main Components

### KanbanBoard
- **Location:** `src/components/KanbanBoard.tsx`
- **Purpose:** Main UI for the Kanban board. Handles drag-and-drop, card creation, deletion, renaming columns, and board state.
- **Key Libraries:**
  - `@dnd-kit/core` for drag-and-drop
  - `lucide-react` for icons
- **State:**
  - Board state is managed with React `useState`, initialized from `initialBoard` in `src/lib/board.ts`.
  - Drafts for new cards are managed per column.

### Home Page
- **Location:** `src/app/page.tsx`
- **Purpose:** Renders the KanbanBoard as the main page.

---

## Board Logic

### Board State & Utilities
- **Location:** `src/lib/board.ts`
- **Types:**
  - `Card`, `Column`, `BoardState`
- **Initial State:**
  - `initialBoard` provides demo columns and cards.
- **Functions:**
  - `renameColumn(board, columnId, title)`
  - `addCard(board, columnId, card)`
  - `deleteCard(board, cardId)`
  - `findCardColumn(board, cardId)`
  - `moveCard(board, cardId, targetColumnId, targetIndex)`

---

## Testing

- **Location:** `src/lib/board.test.ts`
- **Framework:** Vitest
- **Coverage:**
  - Tests for renaming columns, adding, deleting, and moving cards.

---

## How to Run
- `npm run dev` — Start development server
- `npm run test` — Run unit tests
- `npm run test:e2e` — Run end-to-end tests

---

## Notes
- The frontend is a static Next.js app with a single Kanban board and no backend integration yet.
- All board state is in-memory and resets on reload.
