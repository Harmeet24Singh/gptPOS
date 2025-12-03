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
  padding: 1rem;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial;
  color: #243746;
  background: ${colors.bg};
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

export const POSGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  flex: 1;
  align-items: start;
  overflow: hidden;
  min-height: 0;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const ProductsPanel = styled.div`
  background: ${colors.card};
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 6px 20px rgba(36, 55, 70, 0.06);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;

  h2 {
    color: ${colors.primary};
    margin-bottom: 0.75rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
    flex: 1;
    overflow-y: auto;
    padding-right: 0.5rem;
    min-height: 200px;
    max-height: 300px;
  }
`;

export const CheckoutPanel = styled.div`
  background: ${colors.card};
  border-radius: 8px;
  padding: 0.3rem;
  box-shadow: 0 6px 20px rgba(36, 55, 70, 0.06);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow-y: auto;

  h2 {
    color: ${colors.primary};
    margin-bottom: 0.1rem;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .cart-items {
    flex: 0 1 auto;
    overflow-y: auto;
    margin-bottom: 0.3rem;
    min-height: 80px;
    max-height: 120px;
  }

  .checkout-sections {
    flex: 1 1 auto;
    overflow-y: auto;
    padding-right: 0.3rem;
    margin-bottom: 0.2rem;
    max-height: calc(100vh - 350px);

    /* Custom scrollbar */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  }

  .checkout-summary {
    flex: 0 0 auto;
    padding-top: 0.4rem;
    border-top: 1px solid rgba(36, 55, 70, 0.08);
    background: ${colors.card};
    padding-bottom: 0.3rem;
  }
`;

export const ProductItem = styled.div`
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  border: 1px solid rgba(36, 55, 70, 0.04);
  border-radius: 10px;
  padding: 0.6rem 0.6rem;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  height: 90px;
  justify-content: space-between;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 10px 30px rgba(36, 55, 70, 0.08);
  }

  h4 {
    color: ${colors.primary};
    margin: 0;
    font-size: 0.8rem;
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
  gap: 0.3rem;
  align-items: center;
  padding: 0.3rem 0.2rem;
  border-bottom: 1px solid rgba(36, 55, 70, 0.04);

  &:last-child {
    border-bottom: none;
  }

  .item-details {
    display: flex;
    flex-direction: column;

    h4 {
      color: ${colors.primary};
      margin: 0 0 1px 0;
      font-size: 0.75rem;
      font-weight: 600;
    }

    p {
      color: ${colors.muted};
      margin: 0;
      font-size: 0.65rem;
    }
  }

  .quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.2rem;

    button {
      width: 20px;
      height: 20px;
      border-radius: 3px;
      border: none;
      background: ${colors.primary};
      color: white;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.7rem;
    }

    span {
      min-width: 20px;
      text-align: center;
      font-weight: 700;
      font-size: 0.75rem;
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
  padding: 0.4rem;
  border-radius: 4px;
  margin-bottom: 0.3rem;

  div {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.15rem;
    color: #243746;
    font-size: 0.8rem;
  }

  .final-total {
    font-size: 0.95rem;
    font-weight: 800;
    color: ${colors.accent};
    border-top: 1px dashed rgba(36, 55, 70, 0.06);
    padding-top: 0.25rem;
    margin-top: 0.2rem;
  }
`;

export const CheckoutButton = styled.button`
  background: ${colors.accent};
  color: white;
  padding: 0.7rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(39, 174, 96, 0.12);
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
