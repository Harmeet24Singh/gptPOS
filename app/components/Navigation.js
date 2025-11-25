"use client";

import Link from "next/link";
import styled from "styled-components";
import { useAuth } from "../lib/auth";

const Nav = styled.nav`
  background: #2c3e50;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
`;

const NavLinks = styled.ul`
  display: flex;
  list-style: none;
  gap: 2rem;
  margin: 0;
`;

const NavLink = styled.li`
  a {
    color: #ecf0f1;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
      background: #34495e;
    }
  }
`;

export default function Navigation() {
  const auth = useAuth();

  return (
    <Nav>
      <NavContainer>
        <Link href={auth && auth.user ? "/" : "/pos?newSale=true"}>
          <Logo>Store POS</Logo>
        </Link>
        <NavLinks>
          {auth && auth.user ? (
            <>
              <NavLink>
                <Link href="/">Home</Link>
              </NavLink>
              <NavLink>
                <Link href="/pos?newSale=true">POS</Link>
              </NavLink>
              <NavLink>
                <Link href="/inventory">Inventory</Link>
              </NavLink>
              <NavLink>
                <Link href="/categories">Categories</Link>
              </NavLink>
              <NavLink>
                <Link href="/users">Users</Link>
              </NavLink>
              <NavLink>
                <Link href="/inventory/add">Add Item</Link>
              </NavLink>
              <NavLink>
                <Link href="/transactions">Transactions</Link>
              </NavLink>
              <NavLink>
                <Link href="/till-count">💰 Till Count</Link>
              </NavLink>
              <NavLink>
                <Link href="/reports">Reports</Link>
              </NavLink>
              <NavLink>
                <Link href="/credit">Credit Sales</Link>
              </NavLink>
              <NavLink>
                <Link href="/credit-management">Credit Management</Link>
              </NavLink>
            </>
          ) : (
            <NavLink>
              <Link href="/pos?newSale=true">POS</Link>
            </NavLink>
          )}
        </NavLinks>

        <div>
          {auth && auth.user ? (
            <>
              <span style={{ color: "white", marginRight: "1rem" }}>
                {auth.user.username} ({auth.user.role})
              </span>
              <button
                onClick={() => auth.logout()}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login">
              <button
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Login
              </button>
            </Link>
          )}
        </div>
      </NavContainer>
    </Nav>
  );
}
