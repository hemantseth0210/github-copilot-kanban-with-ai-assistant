import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginPage } from "@/components/LoginPage";
import { AuthProvider } from "@/context/AuthContext";

function renderLoginPage() {
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders login form", () => {
    renderLoginPage();
    expect(screen.getByText("Launch Kanban")).toBeInTheDocument();
    expect(screen.getByText("Sign in to your workspace")).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("displays demo credentials hint", () => {
    renderLoginPage();
    expect(screen.getByText(/Demo credentials:/i)).toBeInTheDocument();
  });

  it("shows error for invalid credentials", async () => {
    renderLoginPage();
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: "wrong" } });
    fireEvent.change(passwordInput, { target: { value: "wrong" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });
  });

  it("clears password field after failed login", async () => {
    renderLoginPage();
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: "wrong" } });
    fireEvent.change(passwordInput, { target: { value: "test123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(passwordInput.value).toBe("");
    });
  });

  it("disables form while loading", async () => {
    renderLoginPage();
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: "user" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toHaveTextContent(/signing in/i);
    });
  });

  it("accepts correct credentials", async () => {
    renderLoginPage();
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: "user" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });
    fireEvent.click(submitButton);

    // After successful login, there should be no error message
    await waitFor(() => {
      expect(screen.queryByText(/invalid username or password/i)).not.toBeInTheDocument();
    });
  });
});
