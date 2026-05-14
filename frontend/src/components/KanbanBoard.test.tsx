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

const mockBoardForAiUpdate = {
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
    {
      id: 2,
      board_id: 1,
      name: "Ready",
      position: 1,
      created_at: "2026-01-01T00:00:00Z",
      cards: [],
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

  it("uses AI chat to send a request and display the response", async () => {
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
        json: async () => ({ response: "The AI suggests focusing on the top card." }),
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

    fireEvent.change(screen.getByLabelText(/AI request/i), {
      target: { value: "How should I prioritize work?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Ask AI/i }));

    await waitFor(() => {
      expect(screen.getByText("The AI suggests focusing on the top card.")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai/chat",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("applies AI board updates and refreshes the board state", async () => {
    const fetchMock = vi.mocked(global.fetch, true);
    fetchMock.mockResolvedValueOnce(
      Promise.resolve({
        ok: true,
        json: async () => mockBoardForAiUpdate,
      } as Response),
    );

    fetchMock.mockResolvedValueOnce(
      Promise.resolve({
        ok: true,
        json: async () => ({ response: "Moved the card to Ready.", changes: {}, board: {
          ...mockBoardForAiUpdate,
          columns: [
            {
              ...mockBoardForAiUpdate.columns[0],
              cards: [],
            },
            {
              ...mockBoardForAiUpdate.columns[1],
              cards: [mockBoardForAiUpdate.columns[0].cards[0]],
            },
          ],
        } }),
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

    fireEvent.change(screen.getByLabelText(/AI request/i), {
      target: { value: "Move the top card to Ready." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Update board/i }));

    await waitFor(() => {
      const readyColumn = screen.getByTestId("column-2");
      expect(within(readyColumn).getByText("Test card")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai/kanban",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
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
