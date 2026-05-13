"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const success = await login(username, password);
    if (!success) {
      setError("Invalid username or password");
      setPassword("");
    }

    setIsLoading(false);
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Launch Kanban</h1>
        <p className={styles.subtitle}>Sign in to your workspace</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              disabled={isLoading}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={isLoading}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className={styles.hint}>
          Demo credentials: <strong>user</strong> / <strong>password</strong>
        </p>
      </div>
    </div>
  );
}
