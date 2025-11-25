"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import styled from "styled-components";
import Link from "next/link";

const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e9ecef;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  margin: 0.25rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #2980b9;
  }
`;

const JsonDisplay = styled.pre`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  overflow: auto;
  max-height: 300px;
  font-size: 0.9rem;
`;

export default function LocalStorageViewer() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Redirect to POS if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/pos');
    }
  }, [user, router]);
  const [rawUsers, setRawUsers] = useState("");
  const [rawCurrentUser, setRawCurrentUser] = useState("");

  const loadData = () => {
    try {
      // Load users
      const usersData = localStorage.getItem("users");
      if (usersData) {
        const parsedUsers = JSON.parse(usersData);
        setUsers(parsedUsers);
        setRawUsers(JSON.stringify(parsedUsers, null, 2));
      } else {
        setUsers([]);
        setRawUsers("No users data found in localStorage");
      }

      // Load current user
      const currentUserData = localStorage.getItem("currentUser");
      if (currentUserData) {
        const parsedCurrentUser = JSON.parse(currentUserData);
        setCurrentUser(parsedCurrentUser);
        setRawCurrentUser(JSON.stringify(parsedCurrentUser, null, 2));
      } else {
        setCurrentUser(null);
        setRawCurrentUser("No current user data found in localStorage");
      }
    } catch (error) {
      console.error("Error loading localStorage data:", error);
      setRawUsers("Error loading users data: " + error.message);
      setRawCurrentUser("Error loading current user data: " + error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearUsers = () => {
    if (confirm("Are you sure you want to clear all users data?")) {
      localStorage.removeItem("users");
      loadData();
    }
  };

  const clearCurrentUser = () => {
    localStorage.removeItem("currentUser");
    loadData();
  };

  const restoreDefaultUsers = () => {
    const defaultUsers = [
      {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        password: "admin123",
        role: "Admin",
        active: true,
        permissions: {
          manageUsers: true,
          manageInventory: true,
          manageReports: true,
          managePOS: true,
        },
      },
      {
        id: 2,
        username: "test", // Your custom user
        email: "test@example.com",
        password: "test123",
        role: "Admin",
        active: true,
        permissions: {
          manageUsers: true,
          manageInventory: true,
          manageReports: true,
          managePOS: true,
        },
      },
      {
        id: 3,
        username: "cashier1",
        email: "cashier1@example.com",
        password: "cashier123",
        role: "Cashier",
        active: true,
        permissions: {
          manageUsers: false,
          manageInventory: false,
          manageReports: false,
          managePOS: true,
        },
      },
    ];
    
    localStorage.setItem("users", JSON.stringify(defaultUsers));
    loadData();
  };

  return (
    <Container>
      <h1>LocalStorage Data Viewer</h1>
      
      <Card>
        <h3>Actions</h3>
        <Button onClick={loadData}>Refresh Data</Button>
        <Button onClick={restoreDefaultUsers}>Restore Users (includes admin + test)</Button>
        <Button onClick={clearUsers} style={{background: "#e74c3c"}}>Clear All Users</Button>
        <Button onClick={clearCurrentUser} style={{background: "#f39c12"}}>Logout Current User</Button>
        <Link href="/login"><Button>Go to Login</Button></Link>
        <Link href="/users"><Button>Go to User Management</Button></Link>
      </Card>

      <Card>
        <h3>Current User ({currentUser ? currentUser.username : "None"})</h3>
        <JsonDisplay>{rawCurrentUser}</JsonDisplay>
      </Card>

      <Card>
        <h3>All Users ({users.length} users found)</h3>
        {users.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <strong>User List:</strong>
            <ul>
              {users.map(user => (
                <li key={user.id}>
                  <strong>{user.username}</strong> ({user.role}) - {user.active ? "Active" : "Inactive"}
                </li>
              ))}
            </ul>
          </div>
        )}
        <JsonDisplay>{rawUsers}</JsonDisplay>
      </Card>

      <Card>
        <h3>Instructions</h3>
        <p>Your old users (admin and test) should be stored in your browser's localStorage. If you don't see them:</p>
        <ol>
          <li>Click "Restore Users" above to add both admin and test users</li>
          <li>Or go to User Management to create new users</li>
          <li>The login credentials would be:
            <ul>
              <li><strong>admin</strong> / admin123</li>
              <li><strong>test</strong> / test123</li>
            </ul>
          </li>
        </ol>
      </Card>
    </Container>
  );
}