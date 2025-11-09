"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import Link from "next/link";
import { useAuth } from "../lib/auth";

const Container = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e9ecef;
  padding: 1.25rem;
  border-radius: 8px;
`;

const Button = styled.button`
  padding: 0.6rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const list = await res.json();
          if (mounted && Array.isArray(list) && list.length > 0) {
            setUsers(list);
            setSelected(list[0].username);
            return;
          }
        }
      } catch (e) {
        // ignore and fallback
      }

      // fallback to localStorage if server not available or empty
      try {
        const saved = JSON.parse(localStorage.getItem("users") || "[]");
        if (mounted) {
          setUsers(saved);
          if (saved.length > 0) setSelected(saved[0].username);
        }
      } catch (e) {
        console.error("Failed to read users from localStorage", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (auth && auth.user) {
      // Already logged in, go home
      router.push("/");
    }
  }, [auth, router]);

  const handleLogin = async () => {
    if (!selected) return;
    const ok = await auth.login(selected);
    if (ok) router.push("/");
    else alert("Login failed");
  };

  return (
    <Container>
      <Card>
        <h2>Login (no password)</h2>
        {users.length === 0 ? (
          <div>
            <p>
              No users available. Please create a user first in{" "}
              <Link href="/users">Users</Link>.
            </p>
          </div>
        ) : (
          <div>
            <label style={{ display: "block", marginBottom: 8 }}>
              Select user
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{ width: "100%", padding: "0.6rem", marginBottom: "1rem" }}
            >
              {users.map((u) => (
                <option key={u.id} value={u.username}>
                  {u.username} ({u.role})
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button onClick={handleLogin}>Login</Button>
              <Link href="/users">
                <button style={{ padding: "0.6rem 1rem" }}>Manage Users</button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </Container>
  );
}
