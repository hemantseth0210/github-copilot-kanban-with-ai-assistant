"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LoginPage } from "@/components/LoginPage";

export default function Home() {
  const { isLoggedIn, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isLoading) {
    return null;
  }

  return isLoggedIn ? <KanbanBoard /> : <LoginPage />;
}
