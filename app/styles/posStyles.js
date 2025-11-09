"use client";

import styled from "styled-components";

const colors = {
  primary: "#2c7be5",
  accent: "#27ae60",
  bg: "#f4f7fb",
  card: "#ffffff",
  muted: "#7f8c8d",
  danger: "#e74c3c",
};

export const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial;
  color: #243746;
  background: ${colors.bg};
`;

export const POSGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  min-height: 60vh;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const ProductsPanel = styled.div`
  background: ${colors.card};
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 6px 20px rgba(36, 55, 70, 0.06);
  overflow: hidden;

  h2 {
    color: ${colors.primary};
    margin-bottom: 0.75rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 0.5rem;
  }
`;

export const CheckoutPanel = styled.div`
  background: ${colors.card};
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 6px 20px rgba(36, 55, 70, 0.06);
  display: flex;
  flex-direction: column;

  h2 {
    color: ${colors.primary};
    margin-bottom: 0.75rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .cart-items {
    flex: 1 1 auto;
    max-height: 52vh;
    overflow-y: auto;
    margin-bottom: 0.75rem;
  }

  .checkout-summary {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid rgba(36, 55, 70, 0.06);
    position: sticky;
    bottom: 0;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0),
      ${colors.card} 40%
    );
    padding-bottom: 0.75rem;
  }
`;

export const ProductItem = styled.div`
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  border: 1px solid rgba(36, 55, 70, 0.04);
  border-radius: 10px;
  padding: 0.9rem 0.9rem;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 10px 30px rgba(36, 55, 70, 0.08);
  }

  h4 {
    color: ${colors.primary};
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.1;
    font-weight: 600;
  }

  .price-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .price {
    font-weight: 700;
    color: ${colors.accent};
  }

  .stock {
    color: ${colors.muted};
    font-size: 0.8rem;
  }
`;

export const CartItem = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.9rem 0.6rem;
  border-bottom: 1px solid rgba(36, 55, 70, 0.04);

  &:last-child {
    border-bottom: none;
  }

  .item-details {
    display: flex;
    flex-direction: column;

    h4 {
      color: ${colors.primary};
      margin: 0 0 4px 0;
      font-size: 0.95rem;
      font-weight: 600;
    }

    p {
      color: ${colors.muted};
      margin: 0;
      font-size: 0.85rem;
    }
  }

  .quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.4rem;

    button {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      background: ${colors.primary};
      color: white;
      cursor: pointer;
      font-weight: 700;
    }

    span {
      min-width: 28px;
      text-align: center;
      font-weight: 700;
    }
  }

  .item-total {
    text-align: right;
    font-weight: 700;
    color: ${colors.accent};
  }

  .remove-btn {
    margin-left: 0.5rem;
    background: ${colors.danger};
    border-radius: 6px;
    padding: 0.25rem 0.5rem;
    color: white;
    border: none;
  }
`;

export const SearchBar = styled.input`
  flex: 1;
  padding: 0.75rem 0.9rem;
  border: 1px solid rgba(36, 55, 70, 0.06);
  border-radius: 8px;
  font-size: 1rem;
  background: #fff;
  box-shadow: inset 0 1px 2px rgba(36, 55, 70, 0.02);

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 4px 12px rgba(44, 123, 229, 0.08);
  }
`;

export const CategoryFilter = styled.select`
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background: white;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

export const Button = styled.button`
  background: ${colors.primary};
  color: white;
  padding: 0.65rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(44, 123, 229, 0.08);
  }
`;

export const Total = styled.div`
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  padding: 0.85rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;

  div {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.4rem;
    color: #243746;
  }

  .final-total {
    font-size: 1.15rem;
    font-weight: 800;
    color: ${colors.accent};
    border-top: 1px dashed rgba(36, 55, 70, 0.06);
    padding-top: 0.5rem;
    margin-top: 0.45rem;
  }
`;

export const CheckoutButton = styled.button`
  background: ${colors.accent};
  color: white;
  padding: 0.9rem;
  border: none;
  border-radius: 10px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  width: 100%;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(39, 174, 96, 0.12);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export const ReceiptSection = styled.div`
  max-width: 520px;
  margin: 0 auto;
  text-align: center;

  h2 {
    color: ${colors.accent};
    margin-bottom: 1.5rem;
  }

  .receipt {
    background: linear-gradient(180deg, #ffffff, #fbfdff);
    border: 1px solid rgba(36, 55, 70, 0.06);
    border-radius: 10px;
    padding: 1.25rem;
    text-align: left;
    font-family: Inter, system-ui, monospace-fallback;

    h3 {
      text-align: center;
      margin-bottom: 0.5rem;
      color: #243746;
    }

    hr {
      margin: 0.75rem 0;
      border: none;
      border-top: 1px dashed rgba(36, 55, 70, 0.08);
    }

    .receipt-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.4rem;
      font-size: 0.95rem;
    }

    .receipt-totals div {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.35rem;
    }

    .total {
      font-weight: 800;
      font-size: 1.05rem;
      border-top: 1px solid rgba(36, 55, 70, 0.06);
      padding-top: 0.5rem;
    }

    p {
      text-align: center;
      margin: 0.5rem 0;
      color: ${colors.muted};
    }
  }
`;
