import { describe, expect, it } from "vitest";
import {
  addCard,
  BoardState,
  deleteCard,
  moveCard,
  renameColumn,
} from "./board";

function makeBoard(): BoardState {
  return {
    columns: [
      { id: "one", title: "One", cardIds: ["a", "b"] },
      { id: "two", title: "Two", cardIds: ["c"] },
      { id: "three", title: "Three", cardIds: [] },
      { id: "four", title: "Four", cardIds: [] },
      { id: "five", title: "Five", cardIds: [] },
    ],
    cards: {
      a: { id: "a", title: "Alpha", details: "First card" },
      b: { id: "b", title: "Beta", details: "Second card" },
      c: { id: "c", title: "Gamma", details: "Third card" },
    },
  };
}

describe("board state", () => {
  it("renames a column", () => {
    const board = renameColumn(makeBoard(), "one", "Ideas");

    expect(board.columns[0].title).toBe("Ideas");
  });

  it("adds a card to the selected column", () => {
    const board = addCard(makeBoard(), "two", {
      id: "d",
      title: "Delta",
      details: "Fourth card",
    });

    expect(board.columns[1].cardIds).toEqual(["c", "d"]);
    expect(board.cards.d).toEqual({
      id: "d",
      title: "Delta",
      details: "Fourth card",
    });
  });

  it("deletes a card from the board", () => {
    const board = deleteCard(makeBoard(), "b");

    expect(board.cards.b).toBeUndefined();
    expect(board.columns[0].cardIds).toEqual(["a"]);
  });

  it("moves a card between columns", () => {
    const board = moveCard(makeBoard(), "a", "two", 1);

    expect(board.columns[0].cardIds).toEqual(["b"]);
    expect(board.columns[1].cardIds).toEqual(["c", "a"]);
  });

  it("reorders a card inside the same column", () => {
    const board = moveCard(makeBoard(), "b", "one", 0);

    expect(board.columns[0].cardIds).toEqual(["b", "a"]);
  });
});
