"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styled from "styled-components";

const Container = styled.div`
  max-width: 800px;
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

const AddCategoryForm = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid #e9ecef;
`;

const FormTitle = styled.h3`
  color: #2c3e50;
  margin: 0 0 1rem 0;
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  align-items: end;
`;

const InputGroup = styled.div`
  flex: 1;

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #2c3e50;
    font-weight: 600;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: #3498db;
    }
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;

  &:hover {
    background: #229954;
  }

  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
  }
`;

const CategoriesGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
`;

const CategoryCard = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const CategoryName = styled.h4`
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
`;

const CategoryDescription = styled.p`
  color: #7f8c8d;
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const CategoryActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;

  &.edit {
    background: #3498db;
    color: white;

    &:hover {
      background: #2980b9;
    }
  }

  &.delete {
    background: #e74c3c;
    color: white;

    &:hover {
      background: #c0392b;
    }
  }
`;

const ProductCount = styled.div`
  font-size: 0.8rem;
  color: #27ae60;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;

  h3 {
    color: #2c3e50;
    margin-bottom: 1rem;
  }
`;

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [editingCategory, setEditingCategory] = useState(null);

  // Initialize default categories
  const defaultCategories = [
    {
      id: 1,
      name: "Beverages",
      description: "Soft drinks, energy drinks, water, and other beverages",
    },
    {
      id: 2,
      name: "Snacks",
      description: "Chips, crackers, nuts, and other snack foods",
    },
    { id: 3, name: "Bakery", description: "Bread, pastries, and baked goods" },
    { id: 4, name: "Tobacco", description: "Cigarettes and tobacco products" },
    {
      id: 5,
      name: "Dairy",
      description: "Milk, cheese, yogurt, and dairy products",
    },
    {
      id: 6,
      name: "Frozen Foods",
      description: "Ice cream, frozen meals, and frozen items",
    },
    {
      id: 7,
      name: "Personal Care",
      description: "Toiletries, hygiene, and personal care items",
    },
    {
      id: 8,
      name: "Household",
      description: "Cleaning supplies, paper products, and household items",
    },
  ];

  useEffect(() => {
    // Load categories from localStorage or use defaults
    const savedCategories = localStorage.getItem("categories");
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      setCategories(defaultCategories);
      localStorage.setItem("categories", JSON.stringify(defaultCategories));
    }

    // Load inventory to count products per category
    const savedInventory = localStorage.getItem("inventory");
    if (savedInventory) {
      setInventory(JSON.parse(savedInventory));
    }
  }, []);

  const getProductCount = (categoryName) => {
    return inventory.filter((item) => item.category === categoryName).length;
  };

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      alert("Category name is required");
      return;
    }

    // Check if category already exists
    if (
      categories.some(
        (cat) => cat.name.toLowerCase() === newCategory.name.toLowerCase()
      )
    ) {
      alert("Category already exists");
      return;
    }

    const category = {
      id: Date.now(),
      name: newCategory.name.trim(),
      description: newCategory.description.trim(),
    };

    const updatedCategories = [...categories, category];
    setCategories(updatedCategories);
    localStorage.setItem("categories", JSON.stringify(updatedCategories));
    setNewCategory({ name: "", description: "" });
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name || "",
      description: category.description || "",
    });

    // Scroll to top to show the edit form
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleUpdateCategory = () => {
    if (!newCategory.name.trim()) {
      alert("Category name is required");
      return;
    }

    // Check if category name already exists (excluding current category)
    if (
      categories.some(
        (cat) =>
          cat.id !== editingCategory.id &&
          cat.name.toLowerCase() === newCategory.name.toLowerCase()
      )
    ) {
      alert("Category already exists");
      return;
    }

    const updatedCategories = categories.map((cat) =>
      cat.id === editingCategory.id
        ? {
            ...cat,
            name: newCategory.name.trim(),
            description: newCategory.description.trim(),
          }
        : cat
    );

    setCategories(updatedCategories);
    localStorage.setItem("categories", JSON.stringify(updatedCategories));

    // Update category name in inventory items if name changed
    if (editingCategory.name !== newCategory.name.trim()) {
      const updatedInventory = inventory.map((item) =>
        item.category === editingCategory.name
          ? { ...item, category: newCategory.name.trim() }
          : item
      );
      setInventory(updatedInventory);
      localStorage.setItem("inventory", JSON.stringify(updatedInventory));
    }

    setEditingCategory(null);
    setNewCategory({ name: "", description: "" });
  };

  const handleDeleteCategory = (categoryToDelete) => {
    const productCount = getProductCount(categoryToDelete.name);

    if (productCount > 0) {
      if (
        !confirm(
          `This category has ${productCount} product(s). Are you sure you want to delete it? Products will be moved to "Uncategorized".`
        )
      ) {
        return;
      }

      // Move products to "Uncategorized"
      const updatedInventory = inventory.map((item) =>
        item.category === categoryToDelete.name
          ? { ...item, category: "Uncategorized" }
          : item
      );
      setInventory(updatedInventory);
      localStorage.setItem("inventory", JSON.stringify(updatedInventory));
    } else {
      if (!confirm("Are you sure you want to delete this category?")) {
        return;
      }
    }

    const updatedCategories = categories.filter(
      (cat) => cat.id !== categoryToDelete.id
    );
    setCategories(updatedCategories);
    localStorage.setItem("categories", JSON.stringify(updatedCategories));
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setNewCategory({ name: "", description: "" });
  };

  return (
    <Container>
      <Header>
        <Title>Category Management</Title>
        <BackButton href="/inventory">← Back to Inventory</BackButton>
      </Header>

      <AddCategoryForm>
        <FormTitle>
          {editingCategory
            ? `Edit Category: ${editingCategory.name}`
            : "Add New Category"}
        </FormTitle>
        <FormRow>
          <InputGroup>
            <label>Category Name *</label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
              placeholder="e.g., Electronics, Cosmetics"
              maxLength={50}
            />
          </InputGroup>
          <InputGroup>
            <label>Description</label>
            <input
              type="text"
              value={newCategory.description}
              onChange={(e) =>
                setNewCategory({ ...newCategory, description: e.target.value })
              }
              placeholder="Brief description of this category"
              maxLength={200}
            />
          </InputGroup>
          <div>
            {editingCategory ? (
              <>
                <Button onClick={handleUpdateCategory}>Update Category</Button>
                <Button
                  onClick={cancelEdit}
                  style={{ marginLeft: "0.5rem", background: "#95a5a6" }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={handleAddCategory}>Add Category</Button>
            )}
          </div>
        </FormRow>
      </AddCategoryForm>

      {categories.length === 0 ? (
        <EmptyState>
          <h3>No Categories Yet</h3>
          <p>
            Add your first category above to get started organizing your
            inventory.
          </p>
        </EmptyState>
      ) : (
        <CategoriesGrid>
          {categories.map((category) => (
            <CategoryCard key={category.id}>
              <CategoryName>{category.name}</CategoryName>
              {category.description && (
                <CategoryDescription>
                  {category.description}
                </CategoryDescription>
              )}
              <ProductCount>
                {getProductCount(category.name)} product(s)
              </ProductCount>
              <CategoryActions>
                <ActionButton
                  className="edit"
                  onClick={() => handleEditCategory(category)}
                >
                  Edit
                </ActionButton>
                <ActionButton
                  className="delete"
                  onClick={() => handleDeleteCategory(category)}
                >
                  Delete
                </ActionButton>
              </CategoryActions>
            </CategoryCard>
          ))}
        </CategoriesGrid>
      )}
    </Container>
  );
}
