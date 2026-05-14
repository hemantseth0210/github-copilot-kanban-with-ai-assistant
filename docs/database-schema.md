# Database Schema for Kanban MVP

## Overview

The Kanban application uses SQLite for local data persistence. The schema supports the MVP requirements:
- Single hardcoded user ("user"/"password")
- One Kanban board per user
- Fixed number of columns (5) that can be renamed
- Cards that can be moved between columns and edited

## Tables

### users
Stores user accounts. For MVP, contains one hardcoded user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user identifier |
| username | TEXT | UNIQUE NOT NULL | Username for login |
| password_hash | TEXT | NOT NULL | Hashed password (for MVP, stored as-is) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Account creation time |

### boards
Represents Kanban boards. MVP has one board per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique board identifier |
| user_id | INTEGER | NOT NULL REFERENCES users(id) | Owner of the board |
| name | TEXT | NOT NULL | Board name (default: "Launch Kanban") |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Board creation time |

### columns
Kanban columns. Fixed to 5 columns per board, but names are editable.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique column identifier |
| board_id | INTEGER | NOT NULL REFERENCES boards(id) | Board this column belongs to |
| name | TEXT | NOT NULL | Column name (e.g., "Backlog", "Ready") |
| position | INTEGER | NOT NULL | Display order (0-4) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Column creation time |

### cards
Kanban cards that can be moved between columns.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique card identifier |
| column_id | INTEGER | NOT NULL REFERENCES columns(id) | Current column |
| title | TEXT | NOT NULL | Card title |
| details | TEXT | | Card description/details |
| position | INTEGER | NOT NULL | Position within column (for ordering) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Card creation time |

## Relationships

- `users` 1:N `boards` (one user can have multiple boards, though MVP uses 1)
- `boards` 1:N `columns` (one board has multiple columns)
- `columns` 1:N `cards` (one column contains multiple cards)

## Indexes

- `idx_boards_user_id` on `boards(user_id)`
- `idx_columns_board_id` on `columns(board_id)`
- `idx_cards_column_id` on `cards(column_id)`
- `idx_cards_position` on `cards(column_id, position)`

## Initial Data

For MVP, the database will be initialized with:
- One user: username="user", password="password"
- One board: name="Launch Kanban"
- Five columns: "Backlog", "Ready", "In Progress", "Review", "Done"
- Ten sample cards distributed across columns

## Migration Strategy

Since this is SQLite with no existing data, the schema will be created on first run. Future migrations can be handled by versioned SQL scripts.

## JSON Schema Example

See `docs/schema-example.json` for a sample data structure.