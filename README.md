# Convenience Store Inventory & POS Management System

A complete Next.js 14 inventory management and point-of-sale system designed specifically for convenience stores. This comprehensive solution combines inventory tracking with a full-featured POS system for seamless store operations.

## 🛍️ Key Features

### Point of Sale (POS)
- **Interactive Checkout Interface** - Touch-friendly product selection and cart management
- **Real-time Inventory Integration** - Automatic stock updates after each sale
- **Receipt Generation** - Professional transaction receipts with detailed breakdowns
- **Product-wise HST Configuration** - Set HST taxability per product, with automatic calculation for taxable items only (13% Ontario HST rate)
- **Transaction History** - Complete sales records with searchable history

### Inventory Management
- **Complete Product Management** - Add, edit, delete, and view inventory items
- **Real-time Stock Tracking** - Monitor inventory levels with automatic updates
- **Low Stock Alerts** - Notifications when items fall below threshold levels
- **Category Organization** - Organize products by type (Beverages, Snacks, etc.)
- **Search & Filter** - Find products quickly by name or category
- **Bulk Stock Operations** - Quick stock adjustments with +/- buttons

### Analytics & Reporting
- **Sales Analytics** - Revenue tracking, transaction counts, and performance metrics
- **Inventory Reports** - Stock levels, values, and category breakdowns
- **Business Intelligence** - Top-selling items, daily/weekly/monthly views
- **Financial Overview** - Total sales, today's revenue, and average transaction value

## 🏗️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Styled Components (no Tailwind CSS)
- **Language**: JavaScript (no TypeScript)
- **State Management**: React hooks with localStorage persistence
- **UI Design**: Modern, responsive design optimized for touch interfaces

## 📱 Application Pages

1. **Dashboard** (`/`) - Main overview with quick access to all features
2. **Point of Sale** (`/pos`) - Complete POS interface for processing sales
3. **Inventory Management** (`/inventory`) - View and manage all products
4. **Add New Item** (`/inventory/add`) - Form to add new products to inventory
5. **Low Stock Monitor** (`/inventory/low-stock`) - Items requiring restocking
6. **Transaction History** (`/transactions`) - Complete sales history and analytics
7. **Reports & Analytics** (`/reports`) - Business insights and performance metrics

## 🚀 Getting Started

### Installation
```bash
# Clone or download the project
cd convenience-store-inventory

# Install dependencies
npm install
```

### Development
```bash
# Start development server
npm run dev
```
Application opens at `http://localhost:3000` (or next available port)

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 💡 How to Use

### POS System Workflow
1. Navigate to POS (`/pos`)
2. Browse products by category or search
3. Click products to add to cart
4. Adjust quantities using +/- buttons
5. Review cart and total (including tax)
6. Process payment to complete sale
7. View receipt and start new sale

### Inventory Management
1. Add products via "Add Item" page
2. Monitor stock levels in inventory view
3. Use quick stock adjustment buttons
4. Check low stock page for items needing attention
5. View comprehensive reports for business insights

## 🎯 POS Features in Detail

### Product Selection
- Grid layout with product cards showing name, price, and stock
- Category filtering (Beverages, Snacks, Bakery, Tobacco, etc.)
- Real-time search functionality
- Stock availability indicators
- One-click add to cart

### Shopping Cart
- Quantity controls with +/- buttons
- Individual item removal
- Live subtotal calculation
- - Smart HST computation based on product taxability (13% Ontario rate, applied only to taxable items)
- - Clear total pricing display with HST breakdown when applicable

### Transaction Processing
- Complete sale processing with inventory updates
- Unique transaction ID generation
- Professional receipt generation
- Transaction timestamp recording
- Automatic new sale initialization

## 🏪 Sample Data

The system comes pre-loaded with typical convenience store items:
- **Beverages**: Coca Cola, Red Bull, etc.
- **Snacks**: Lays chips, candy, crackers
- **Bakery**: Bread, pastries, baked goods
- **Tobacco**: Cigarettes (with age verification considerations)
- **Personal Care**: Basic hygiene and health products

## 🔧 Customization Options

### Product-wise HST Configuration
The system now supports individual product tax settings:

1. **In Inventory Management**: Each product has a "Taxable" column showing "HST" or "No HST"
2. **When Adding Products**: Checkbox option "Subject to HST (13%)" in the add item form
3. **In POS System**: Products show "+ HST" or "HST Free" indicators
4. **Smart Calculation**: HST is only calculated on taxable items in the cart

#### Common Tax-Free Items in Canada:
- Basic groceries (bread, milk, eggs)
- Prescription medications
- Some children's items

#### Taxable Items:
- Prepared foods and beverages
- Non-essential items
- Tobacco products
- Snacks and candy

### Product Categories
Modify available categories in `/app/inventory/add/page.js`:
```javascript
const categories = ['Beverages', 'Snacks', 'Bakery', 'Tobacco', 'Dairy', 'Frozen', 'Personal Care', 'Other']
```

### Low Stock Thresholds
Set custom thresholds when adding products or modify existing ones in inventory management.

## 📊 Business Analytics

The system automatically tracks:
- **Sales Metrics**: Total revenue, transaction count, average sale value
- **Product Performance**: Top-selling items, category performance
- **Inventory Status**: Stock levels, low stock alerts, out-of-stock items
- **Time-based Reports**: Daily, weekly, monthly sales summaries
- **Financial Overview**: Revenue trends and business performance

## 🎨 Design System

- **Color Scheme**: Professional blue/green palette with clear status indicators
- **Typography**: System fonts for maximum compatibility and readability
- **Layout**: Responsive grid and flexbox layouts optimized for both desktop and mobile
- **Touch Interface**: Large buttons and touch-friendly controls for POS usage
- **Visual Hierarchy**: Clear information architecture for quick navigation

## 📁 Project Structure

```
├── app/
│   ├── components/
│   │   └── Navigation.js          # Main navigation component
│   ├── inventory/
│   │   ├── add/page.js           # Add new item form
│   │   ├── low-stock/page.js     # Low stock monitoring
│   │   └── page.js               # Main inventory management
│   ├── pos/
│   │   └── page.js               # Point of sale interface
│   ├── transactions/
│   │   └── page.js               # Transaction history and analytics
│   ├── reports/
│   │   └── page.js               # Business reports and insights
│   ├── styles/
│   │   ├── globalStyles.js       # Global styling
│   │   ├── homeStyles.js         # Dashboard styles
│   │   ├── inventoryStyles.js    # Inventory management styles
│   │   └── posStyles.js          # POS interface styles
│   ├── lib/
│   │   └── registry.js           # Styled components setup
│   ├── layout.js                 # Application layout
│   └── page.js                   # Dashboard homepage
├── .github/
│   └── copilot-instructions.md   # Development documentation
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies and scripts
└── README.md                     # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone <repository-url>
   cd convenience-store-inventory
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint

## Usage

### Managing Inventory

1. **View Inventory**: Navigate to the Inventory page to see all items
2. **Add Items**: Click "Add New Item" to add products to inventory
3. **Update Stock**: Use +/- buttons to quickly adjust stock levels
4. **Delete Items**: Remove items no longer carried
5. **Search & Filter**: Use search bar and category filter to find items

### Stock Management

- Set low stock thresholds for each item
- Monitor the "Low Stock" page for items needing restocking
- Use quick restock buttons for fast inventory updates

### Reports

- View total inventory value and item counts
- Analyze inventory by category
- Monitor stock status across all items

## Customization

### Adding Categories

Edit the categories array in \`app/inventory/add/page.js\`:

\`\`\`javascript
const categories = ['Beverages', 'Snacks', 'Bakery', 'Tobacco', 'Dairy', 'Frozen', 'Personal Care', 'Other']
\`\`\`

### Styling

All styles are in the \`app/styles/\` directory using styled-components. Modify these files to customize the appearance.

### Data Persistence

Currently uses localStorage. For production, integrate with a database by:

1. Creating API routes in \`app/api/\`
2. Replacing localStorage calls with API calls
3. Setting up a database (PostgreSQL, MongoDB, etc.)

## Production Deployment

1. Build the application:
   \`\`\`bash
   npm run build
   \`\`\`

2. Deploy to platforms like Vercel, Netlify, or any hosting service that supports Next.js

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.