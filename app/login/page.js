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
  font-size: 1rem;
  
  &:hover {
    background: #2980b9;
  }
  
  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
  }
`;

const InputField = styled.input`
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (auth && auth.user) {
      // Already logged in, go home
      router.push("/");
    }
  }, [auth, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    // Try to authenticate with username and password using new auth API
    try {
      const authRes = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (authRes.ok) {
        const { user } = await authRes.json();
        if (user) {
          // Store user and redirect
          localStorage.setItem("currentUser", JSON.stringify(user));
          const ok = await auth.login(user.username || user.id, password);
          if (ok) {
            router.push("/");
            return;
          }
        }
      } else {
        const errorData = await authRes.json();
        console.error("Auth API error:", errorData.error);
      }
    } catch (e) {
      console.error("Authentication request failed:", e);
    }

    // Fallback: Try direct authentication with username and password
    try {
      const ok = await auth.login(username, password);
      if (ok) {
        router.push("/");
        return;
      }
    } catch (e) {
      console.error("Fallback authentication failed:", e);
    }

    setError("Invalid username or password");
  };

  return (
    <Container>
      <Card>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
              Username
            </label>
            <InputField
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
              Password
            </label>
            <InputField
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div style={{
              background: "#f8d7da",
              color: "#721c24",
              padding: "0.75rem",
              borderRadius: "4px",
              marginBottom: "1rem",
              border: "1px solid #f5c6cb"
            }}>
              {error}
            </div>
          )}
          
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Button type="submit">Login</Button>
            <Link href="/users">
              <button type="button" style={{ 
                padding: "0.6rem 1rem", 
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}>
                Manage Users
              </button>
            </Link>
          </div>
        </form>
        
        <div style={{ 
          marginTop: "2rem", 
          padding: "1rem", 
          background: "#e9ecef", 
          borderRadius: "4px",
          fontSize: "0.9rem"
        }}>
          <strong>Default Users:</strong>
          <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
            <li>admin / admin123 (Admin)</li>
            <li>cashier1 / cashier123 (Cashier)</li>
            <li>manager1 / manager123 (Manager)</li>
          </ul>
        </div>
      </Card>
    </Container>
  );
}
