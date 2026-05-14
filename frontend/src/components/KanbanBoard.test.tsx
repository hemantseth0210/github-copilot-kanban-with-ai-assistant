import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { AuthProvider } from "@/context/AuthContext";
import { KanbanBoard } from "./KanbanBoard";

const mockBoard = {
  id: 1,
  user_id: 1,
  name: "Launch Kanban",
  created_at: "2026-01-01T00:00:00Z",
  columns: [
    {
      id: 1,
      board_id: 1,
      name: "Backlog",
      position: 0,
      created_at: "2026-01-01T00:00:00Z",
      cards: [
        {
          id: 1,
          column_id: 1,
          title: "Test card",
          details: "Details for test card",
          position: 0,
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    },
  ],
};

describe("KanbanBoard API integration", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads board data from the backend API", async () => {
    const fetchMock = vi.mocked(global.fetch, true);
    fetchMock.mockResolvedValueOnce(
      Promise.resolve({
        ok: true,
        json: async () => mockBoard,
      } as Response),
    );

    render(
      <AuthProvider>
        <KanbanBoard />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Test card")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/board");
  });

  it("adds a new card through the backend API", async () => {
    const fetchMock = vi.mocked(global.fetch, true);
    fetchMock.mockResolvedValueOnce(
      Promise.resolve({
        ok: true,
        json: async () => mockBoard,
      } as Response),
    );

    fetchMock.mockResolvedValueOnce(
      Promise.resolve({
        ok: true,
        json: async () => ({
          id: 2,
          column_id: 1,
          title: "New card",
          details: "New details",
          position: 1,
          created_at: "2026-01-01T00:00:00Z",
        }),
      } as Response),
    );

    render(
      <AuthProvider>
        <KanbanBoard />
      </AuthProvider>,
    );

    const backlogColumn = await screen.findByTestId("column-1");
    const titleInput = within(backlogColumn).getByLabelText("New Backlog card title");
    const detailsInput = within(backlogColumn).getByLabelText("New Backlog card details");
    const addButton = within(backlogColumn).getByRole("button", { name: /Add card/i });

    fireEvent.change(titleInput, { target: { value: "New card" } });
    fireEvent.change(detailsInput, { target: { value: "New details" } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("New card")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/board");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/cards",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });
});
