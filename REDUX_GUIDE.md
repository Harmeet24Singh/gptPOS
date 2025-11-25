# Redux Integration Guide

Redux Toolkit has been successfully installed and configured in your POS project. Here's how to use it:

## 🚀 What's Installed

- **@reduxjs/toolkit** - Modern Redux with built-in best practices
- **react-redux** - React bindings for Redux

## 📁 File Structure

```
app/lib/
├── store.js              # Redux store configuration
├── ReduxProvider.js      # Provider component for wrapping app
├── hooks.js              # Custom hooks for using Redux
└── slices/
    ├── inventorySlice.js # Inventory state management
    ├── cartSlice.js      # Cart and payment state management
    └── authSlice.js      # Authentication state management
```

## 🔧 Configuration

The Redux store is already configured in `app/lib/store.js` with three main slices:

1. **Inventory Slice** - Manages product data, loading states
2. **Cart Slice** - Handles shopping cart, payments, transactions
3. **Auth Slice** - User authentication and session management

## 💻 Usage Examples

### Basic Hook Usage

```javascript
import { useAppSelector, useAppDispatch, useCart, useInventory } from '../lib/hooks';
import { addToCart, removeFromCart } from '../lib/slices/cartSlice';
import { loadInventory } from '../lib/slices/inventorySlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const cart = useCart();
  const inventory = useInventory();
  
  // Add item to cart
  const handleAddToCart = (product) => {
    dispatch(addToCart(product));
  };
  
  // Load inventory
  useEffect(() => {
    dispatch(loadInventory());
  }, [dispatch]);
  
  return (
    <div>
      <p>Cart has {cart.items.length} items</p>
      <p>Inventory has {inventory.items.length} products</p>
    </div>
  );
}
```

### Cart Management

```javascript
import { 
  addToCart, 
  removeFromCart, 
  updateCartQuantity, 
  toggleItemTax,
  processPayment 
} from '../lib/slices/cartSlice';

// Add product to cart
dispatch(addToCart(product));

// Remove from cart
dispatch(removeFromCart(productId));

// Update quantity
dispatch(updateCartQuantity({ productId, quantity: 3 }));

// Toggle tax on item
dispatch(toggleItemTax(productId));

// Process payment
dispatch(processPayment({ 
  cart: cart.items, 
  paymentData: { subtotal, tax, total, paymentBreakdown, change } 
}));
```

### Inventory Management

```javascript
import { loadInventory, updateInventoryAfterTransaction } from '../lib/slices/inventorySlice';

// Load inventory (tries database → localStorage → fallback)
dispatch(loadInventory());

// Refresh after transaction
dispatch(updateInventoryAfterTransaction(cartItems));
```

### Authentication

```javascript
import { loginSuccess, logout, initializeAuth } from '../lib/slices/authSlice';

// Initialize auth on app start
dispatch(initializeAuth());

// Login user
dispatch(loginSuccess(userData));

// Logout
dispatch(logout());
```

## 🔄 Migration from useState

Your current POS page uses useState. Here's how to migrate:

**Before (useState):**
```javascript
const [inventory, setInventory] = useState([]);
const [cart, setCart] = useState([]);
const [cashAmount, setCashAmount] = useState(0);
```

**After (Redux):**
```javascript
const inventory = useAppSelector(state => state.inventory);
const cart = useAppSelector(state => state.cart);
const dispatch = useAppDispatch();

// Instead of setInventory(data)
dispatch(loadInventory());

// Instead of setCart([...cart, item])
dispatch(addToCart(item));

// Instead of setCashAmount(amount)
dispatch(setCashAmount(amount));
```

## 📊 State Structure

### Inventory State
```javascript
{
  items: [],           // Product array
  loading: false,      // Loading indicator
  error: null,         // Error message
  source: 'database'   // Data source: 'database'|'localStorage'|'fallback'
}
```

### Cart State
```javascript
{
  items: [],              // Cart items with quantity, applyTax
  cashAmount: 0,          // Cash payment amount
  cardAmount: 0,          // Card payment amount
  autoFillOther: true,    // Auto-fill other payment method
  lastEdited: null,       // Last edited payment field
  paymentError: null,     // Payment error message
  showReceipt: false,     // Receipt display flag
  lastTransaction: null,  // Last completed transaction
  processing: false       // Payment processing state
}
```

### Auth State
```javascript
{
  user: null,            // User object
  isAuthenticated: false, // Authentication status
  loading: false,        // Auth loading state
  error: null           // Auth error message
}
```

## 🎯 Benefits of Using Redux

1. **Centralized State** - All app state in one place
2. **Predictable Updates** - Actions clearly define what changed
3. **Time Travel Debugging** - Redux DevTools for debugging
4. **Better Testing** - Easier to test pure reducer functions
5. **Performance** - Selective component re-rendering
6. **Async Handling** - Built-in support for async operations

## 🛠️ Example Implementation

See `app/pos/redux-example.js` for a complete Redux-powered POS component that demonstrates all the concepts above.

## 🔍 Redux DevTools

Install the Redux DevTools browser extension to debug your state:
- Chrome: Redux DevTools Extension
- Firefox: Redux DevTools Extension

This will show you:
- Current state tree
- Action history
- State diffs
- Time travel debugging

## 📈 Next Steps

1. **Gradual Migration** - You can use Redux alongside existing useState
2. **Add More Slices** - Create slices for reports, users, categories
3. **Async Operations** - Use createAsyncThunk for API calls
4. **Middleware** - Add logging, persistence, or custom middleware
5. **Performance** - Use React.memo and selector optimizations

The Redux setup is ready to use! You can start by importing the hooks and gradually migrating components from useState to Redux.