// Authentication utilities

const HARDCODED_USERNAME = "user";
const HARDCODED_PASSWORD = "password";
const AUTH_KEY = "kanban_auth_token";

export function validateCredentials(username: string, password: string): boolean {
  return username === HARDCODED_USERNAME && password === HARDCODED_PASSWORD;
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_KEY, token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_KEY);
  }
  return null;
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}
