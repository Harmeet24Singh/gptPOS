"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import styled from "styled-components";
import Link from "next/link";

const Container = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  text-align: center;
`;

const Button = styled.button`
  padding: 1rem 2rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin: 0.5rem;

  &:hover {
    background: #c0392b;
  }
`;

const BackButton = styled(Link)`
  padding: 0.5rem 1rem;
  background: #95a5a6;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: inline-block;
  margin: 1rem;

  &:hover {
    background: #7f8c8d;
  }
`;

export default function ResetPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [message, setMessage] = useState("");

  // Redirect to POS if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/pos');
    }
  }, [user, router]);

  const handleReset = () => {
    try {
      // Clear localStorage
      localStorage.removeItem("users");
      localStorage.removeItem("currentUser");
      setMessage("✓ localStorage cleared! Refresh the page to see default users.");
    } catch (error) {
      setMessage("✗ Error clearing localStorage: " + error.message);
    }
  };

  return (
    <Container>
      <h1>Reset User Data</h1>
      <p>This will clear all user data and reset to default users (admin, cashier1, manager1).</p>
      
      <Button onClick={handleReset}>
        Reset User Data
      </Button>
      
      {message && (
        <div style={{ 
          margin: "2rem 0", 
          padding: "1rem", 
          background: message.includes("✓") ? "#d4edda" : "#f8d7da",
          borderRadius: "4px",
          color: message.includes("✓") ? "#155724" : "#721c24"
        }}>
          {message}
        </div>
      )}

      <div>
        <BackButton href="/login">Go to Login</BackButton>
        <BackButton href="/users">Go to User Management</BackButton>
      </div>
    </Container>
  );
}