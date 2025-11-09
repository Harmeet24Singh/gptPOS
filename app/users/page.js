"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styled from "styled-components";
import { useAuth } from "../lib/auth";

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #2c3e50;
  margin: 0;
`;

const BackButton = styled(Link)`
  padding: 0.5rem 1rem;
  background: #95a5a6;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background: #7f8c8d;
  }
`;

const FormCard = styled.div`
  background: #f8f9fa;
  padding: 1.25rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid #e9ecef;
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  align-items: end;
  flex-wrap: wrap;
`;

const InputGroup = styled.div`
  flex: 1;
  min-width: 200px;

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #2c3e50;
    font-weight: 600;
  }

  input,
  select {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
`;

const Button = styled.button`
  padding: 0.6rem 1rem;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;

  &:hover {
    background: #229954;
  }
  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
`;

const Card = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  padding: 1rem;
  border-radius: 8px;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

export default function UsersPage() {
  const auth = useAuth();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    role: "Cashier",
    active: true,
    permissions: {
      manageUsers: false,
      manageInventory: false,
      manageReports: false,
      managePOS: true,
    },
  });
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("users");
    if (saved) {
      setUsers(JSON.parse(saved));
    } else {
      // default admin user with full permissions
      const defaultUsers = [
        {
          id: 1,
          username: "admin",
          email: "admin@example.com",
          role: "Admin",
          active: true,
          permissions: {
            manageUsers: true,
            manageInventory: true,
            manageReports: true,
            managePOS: true,
          },
        },
      ];
      setUsers(defaultUsers);
      localStorage.setItem("users", JSON.stringify(defaultUsers));
    }
  }, []);

  const saveUsers = (list) => {
    setUsers(list);
    localStorage.setItem("users", JSON.stringify(list));
  };

  const handleAdd = () => {
    if (!newUser.username.trim() || !newUser.email.trim()) {
      alert("Username and email are required");
      return;
    }

    // simple duplicate username check
    if (
      users.some(
        (u) =>
          u.username.toLowerCase() === newUser.username.trim().toLowerCase() &&
          (!editingUser || u.id !== editingUser.id)
      )
    ) {
      alert("Username already exists");
      return;
    }

    // Ensure permissions exist on user object
    if (!newUser.permissions) {
      // set sensible defaults based on role
      const def =
        newUser.role === "Admin"
          ? {
              manageUsers: true,
              manageInventory: true,
              manageReports: true,
              managePOS: true,
            }
          : newUser.role === "Manager"
          ? {
              manageUsers: false,
              manageInventory: true,
              manageReports: true,
              managePOS: true,
            }
          : {
              manageUsers: false,
              manageInventory: false,
              manageReports: false,
              managePOS: true,
            };
      newUser.permissions = def;
    }

    if (editingUser) {
      // Prevent logged-in admin from removing their own Admin role
      if (editingUser.id === auth.user.id && newUser.role !== "Admin") {
        alert(
          "You cannot remove your own Admin role. Ask another Admin to change your role."
        );
        return;
      }

      const updated = users.map((u) =>
        u.id === editingUser.id ? { ...u, ...newUser } : u
      );
      saveUsers(updated);
      // If admin edited their own account, refresh currentUser in auth by re-login
      if (editingUser && auth && auth.user && editingUser.id === auth.user.id) {
        auth.login(newUser.username);
      }
      setEditingUser(null);
      setNewUser({
        username: "",
        email: "",
        role: "Cashier",
        active: true,
        permissions: {
          manageUsers: false,
          manageInventory: false,
          manageReports: false,
          managePOS: true,
        },
      });
    } else {
      const user = { id: Date.now(), ...newUser };
      const updated = [...users, user];
      saveUsers(updated);
      setNewUser({
        username: "",
        email: "",
        role: "Cashier",
        active: true,
        permissions: {
          manageUsers: false,
          manageInventory: false,
          manageReports: false,
          managePOS: true,
        },
      });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setNewUser({
      username: user.username || "",
      email: user.email || "",
      role: user.role || "Cashier",
      active: user.active !== false,
      permissions: user.permissions || {
        manageUsers: false,
        manageInventory: false,
        manageReports: false,
        managePOS: true,
      },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (userToDelete) => {
    if (!confirm(`Delete user ${userToDelete.username}?`)) return;
    const updated = users.filter((u) => u.id !== userToDelete.id);
    saveUsers(updated);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setNewUser({
      username: "",
      email: "",
      role: "Cashier",
      active: true,
      permissions: {
        manageUsers: false,
        manageInventory: false,
        manageReports: false,
        managePOS: true,
      },
    });
  };

  // Protect page: only Admins can manage users
  if (!auth || !auth.user) {
    return (
      <Container>
        <Header>
          <Title>User Management</Title>
        </Header>
        <p>
          You must be logged in as an Admin to access this page.{" "}
          <Link href="/login">Login</Link>
        </p>
      </Container>
    );
  }

  if (auth.user.role !== "Admin") {
    return (
      <Container>
        <Header>
          <Title>User Management</Title>
        </Header>
        <p>Access denied. You must be an Admin to manage users.</p>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>User Management</Title>
        <BackButton href="/">← Back</BackButton>
      </Header>

      <FormCard>
        <h3>
          {editingUser ? `Edit User: ${editingUser.username}` : "Add New User"}
        </h3>
        <FormRow>
          <InputGroup>
            <label>Username *</label>
            <input
              value={newUser.username}
              onChange={(e) =>
                setNewUser({ ...newUser, username: e.target.value })
              }
            />
          </InputGroup>
          <InputGroup>
            <label>Email *</label>
            <input
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
            />
          </InputGroup>
          <InputGroup>
            <label>Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option>Admin</option>
              <option>Cashier</option>
              <option>Manager</option>
            </select>
          </InputGroup>
          <InputGroup style={{ minWidth: "120px" }}>
            <label>Active</label>
            <select
              value={newUser.active ? "true" : "false"}
              onChange={(e) =>
                setNewUser({ ...newUser, active: e.target.value === "true" })
              }
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </InputGroup>
          <InputGroup style={{ minWidth: "220px" }}>
            <label>Permissions</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label>
                <input
                  type="checkbox"
                  checked={!!newUser.permissions?.manageUsers}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      permissions: {
                        ...newUser.permissions,
                        manageUsers: e.target.checked,
                      },
                    })
                  }
                />{" "}
                Manage Users
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!newUser.permissions?.manageInventory}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      permissions: {
                        ...newUser.permissions,
                        manageInventory: e.target.checked,
                      },
                    })
                  }
                />{" "}
                Manage Inventory
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!newUser.permissions?.manageReports}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      permissions: {
                        ...newUser.permissions,
                        manageReports: e.target.checked,
                      },
                    })
                  }
                />{" "}
                Access Reports
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!newUser.permissions?.managePOS}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      permissions: {
                        ...newUser.permissions,
                        managePOS: e.target.checked,
                      },
                    })
                  }
                />{" "}
                Access POS
              </label>
            </div>
          </InputGroup>
          <div>
            <Button onClick={handleAdd}>
              {editingUser ? "Update User" : "Add User"}
            </Button>
            {editingUser && (
              <Button
                onClick={cancelEdit}
                style={{ marginLeft: "0.5rem", background: "#95a5a6" }}
              >
                Cancel
              </Button>
            )}
          </div>
        </FormRow>
      </FormCard>

      {users.length === 0 ? (
        <div>No users yet</div>
      ) : (
        <Grid>
          {users.map((user) => (
            <Card key={user.id}>
              <div style={{ fontWeight: 700 }}>
                {user.username}{" "}
                {user.role === "Admin" && (
                  <span
                    style={{
                      color: "#27ae60",
                      fontSize: "0.85rem",
                      marginLeft: "0.5rem",
                    }}
                  >
                    Admin
                  </span>
                )}
              </div>
              <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                {user.email}
              </div>
              <div style={{ marginTop: "0.5rem" }}>Role: {user.role}</div>
              <div>Active: {user.active ? "Yes" : "No"}</div>
              <div style={{ marginTop: "0.5rem" }}>
                <strong>Permissions:</strong>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#7f8c8d",
                    marginTop: 6,
                  }}
                >
                  {user.permissions?.manageUsers ? "Manage Users, " : ""}
                  {user.permissions?.manageInventory
                    ? "Manage Inventory, "
                    : ""}
                  {user.permissions?.manageReports ? "Reports, " : ""}
                  {user.permissions?.managePOS ? "POS" : ""}
                </div>
              </div>
              <Actions>
                <Button onClick={() => handleEdit(user)}>Edit</Button>
                <Button
                  onClick={() => handleDelete(user)}
                  style={{ background: "#e74c3c" }}
                >
                  Delete
                </Button>
              </Actions>
            </Card>
          ))}
        </Grid>
      )}
    </Container>
  );
}
