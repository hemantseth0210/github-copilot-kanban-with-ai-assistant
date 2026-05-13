import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  validateCredentials,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  isAuthenticated,
} from "@/lib/auth";

describe("Auth utilities", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("validateCredentials", () => {
    it("returns true for correct credentials", () => {
      expect(validateCredentials("user", "password")).toBe(true);
    });

    it("returns false for incorrect username", () => {
      expect(validateCredentials("wrong", "password")).toBe(false);
    });

    it("returns false for incorrect password", () => {
      expect(validateCredentials("user", "wrong")).toBe(false);
    });

    it("returns false for both incorrect", () => {
      expect(validateCredentials("wrong", "wrong")).toBe(false);
    });
  });

  describe("setAuthToken and getAuthToken", () => {
    it("stores and retrieves auth token", () => {
      const token = "test-token-123";
      setAuthToken(token);
      expect(getAuthToken()).toBe(token);
    });

    it("returns null when no token is set", () => {
      expect(getAuthToken()).toBeNull();
    });

    it("overwrites previous token", () => {
      setAuthToken("token-1");
      setAuthToken("token-2");
      expect(getAuthToken()).toBe("token-2");
    });
  });

  describe("clearAuthToken", () => {
    it("removes the auth token", () => {
      setAuthToken("test-token");
      clearAuthToken();
      expect(getAuthToken()).toBeNull();
    });

    it("does not throw when clearing non-existent token", () => {
      expect(() => clearAuthToken()).not.toThrow();
    });
  });

  describe("isAuthenticated", () => {
    it("returns true when token exists", () => {
      setAuthToken("test-token");
      expect(isAuthenticated()).toBe(true);
    });

    it("returns false when no token exists", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("returns false after clearing token", () => {
      setAuthToken("test-token");
      clearAuthToken();
      expect(isAuthenticated()).toBe(false);
    });
  });
});
