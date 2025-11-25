"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const auth = useAuth();
  const [users, setUsers] = useState([]);

  // Redirect to POS if not logged in
  useEffect(() => {
    if (!auth.user) {
      router.push('/pos');
    }
  }, [auth.user, router]);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
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
    // Load users directly from MongoDB database
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const apiUsers = await response.json();
          console.log('Users: Loaded from MongoDB ✅', apiUsers.length, 'users');
          setUsers(apiUsers);
        } else {
          console.error('Users: Failed to load from database');
          setUsers([]);
        }
      } catch (error) {
        console.error('Users: Database connection failed:', error);
        setUsers([]);
      }
    };
    
    loadUsers();
  }, []);

  const saveUser = async (user) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save user ${user.username || user.id}`);
      }
      
      console.log('User saved to MongoDB ✅');
      return true;
    } catch (error) {
      console.error('Failed to save user to database:', error);
      alert(`Failed to save user to database: ${error.message}`);
      return false;
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      console.log('User deleted from MongoDB ✅');
      return true;
    } catch (error) {
      console.error('Failed to delete user from database:', error);
      throw error; // Re-throw to be handled by handleDelete
    }
  };

  const refreshUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const apiUsers = await response.json();
        setUsers(apiUsers);
        console.log('Users refreshed from MongoDB ✅');
      }
    } catch (error) {
      console.error('Failed to refresh users:', error);
    }
  };

  const handleAdd = async () => {
    if (!newUser.username.trim() || !newUser.email.trim() || (!editingUser && !newUser.password.trim())) {
      alert("Username, email, and password are required");
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
      
      // Prevent changing admin role for super admin (admin user)
      if (editingUser.id === 'admin' && newUser.role !== 'Admin' && newUser.role !== 'admin') {
        alert(
          "⚠️ The 'admin' user must maintain Admin role.\n\nThis is a super role protection to ensure system access is maintained."
        );
        return;
      }

      // Update existing user directly in MongoDB
      const userToUpdate = { 
        ...editingUser, 
        ...newUser,
        id: editingUser.id // Ensure ID is preserved
      };
      
      const success = await saveUser(userToUpdate);
      if (success) {
        await refreshUsers(); // Refresh from database
        
        // If admin edited their own account, refresh currentUser in auth
        if (editingUser.id === auth.user.id) {
          auth.login(newUser.username || newUser.id, newUser.password);
        }
        
        setEditingUser(null);
        setNewUser({
          username: "",
          email: "",
          password: "",
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
    } else {
      // Create new user directly in MongoDB
      const user = { 
        id: newUser.username, // Use username as ID for MongoDB
        ...newUser 
      };
      
      const success = await saveUser(user);
      if (success) {
        await refreshUsers(); // Refresh from database
        setNewUser({
          username: "",
          email: "",
          password: "",
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
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setNewUser({
      username: user.username || "",
      email: user.email || "",
      password: "", // Leave empty for existing users - only set when changing password
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

  const handleDelete = async (userToDelete) => {
    // Prevent deletion of admin users (super role protection)
    if (userToDelete.role === 'Admin' || userToDelete.role === 'admin' || userToDelete.id === 'admin') {
      alert('⚠️ Admin users cannot be deleted.\n\nAdmins have super role protection and are essential for system management.');
      return;
    }
    
    if (!confirm(`Delete user ${userToDelete.username || userToDelete.id}?\n\nThis action cannot be undone.`)) return;
    
    try {
      // Delete user directly from MongoDB
      const success = await deleteUser(userToDelete.id || userToDelete.username);
      if (success) {
        await refreshUsers(); // Refresh from database
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      
      // Check if it's an admin protection error
      if (error.message && error.message.includes('Admin users cannot be deleted')) {
        alert('⚠️ ' + error.message);
      } else {
        alert('Failed to delete user from database');
      }
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setNewUser({
      username: "",
      email: "",
      password: "",
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
        {editingUser && (editingUser.role === 'Admin' || editingUser.role === 'admin' || editingUser.id === 'admin') && (
          <div style={{
            background: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "4px",
            padding: "0.75rem",
            marginBottom: "1rem",
            fontSize: "0.9rem"
          }}>
            <strong>🛡️ Admin User Protection:</strong> This is an admin user with super role privileges. 
            Admin users cannot be deleted and must maintain administrative access to ensure system security.
          </div>
        )}
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
            <label>Password {!editingUser ? '*' : '(leave empty to keep current)'}</label>
            <input
              type="password"
              value={newUser.password}
              placeholder={editingUser ? "Enter new password to change" : "Enter password"}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
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
                {(user.role === "Admin" || user.role === "admin") && (
                  <span
                    style={{
                      color: "#27ae60",
                      fontSize: "0.85rem",
                      marginLeft: "0.5rem",
                      background: "#d4edda",
                      padding: "0.2rem 0.4rem",
                      borderRadius: "3px",
                      border: "1px solid #c3e6cb"
                    }}
                    title="Super Role - Cannot be deleted"
                  >
                    🛡️ ADMIN
                  </span>
                )}
              </div>
              <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                {user.email}
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                Role: {user.role}
                {(user.role === "Admin" || user.role === "admin") && (
                  <span style={{ 
                    color: "#27ae60", 
                    fontSize: "0.8rem", 
                    marginLeft: "0.5rem",
                    fontWeight: "600"
                  }}>
                    (Super Role)
                  </span>
                )}
              </div>
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
                {(user.role === 'Admin' || user.role === 'admin' || user.id === 'admin') ? (
                  <Button
                    style={{ 
                      background: "#95a5a6", 
                      cursor: "not-allowed",
                      opacity: 0.6 
                    }}
                    disabled
                    title="Admin users cannot be deleted - Super Role Protection"
                  >
                    🛡️ Protected
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleDelete(user)}
                    style={{ background: "#e74c3c" }}
                  >
                    Delete
                  </Button>
                )}
              </Actions>
            </Card>
          ))}
        </Grid>
      )}
    </Container>
  );
}
