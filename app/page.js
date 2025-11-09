import Link from "next/link";
import {
  Container,
  Title,
  Card,
  CardGrid,
  ButtonLink,
} from "./styles/homeStyles";

export default function Home() {
  return (
    <Container>
      <Title>Convenience Store Inventory Management</Title>

      <CardGrid>
        <Card>
          <h3>Point of Sale</h3>
          <p>Process sales and manage transactions</p>
          <Link href="/pos">
            <ButtonLink>Open POS</ButtonLink>
          </Link>
        </Card>

        <Card>
          <h3>Inventory</h3>
          <p>View and manage your store's inventory items</p>
          <Link href="/inventory">
            <ButtonLink>Manage Inventory</ButtonLink>
          </Link>
        </Card>

        <Card>
          <h3>Add New Item</h3>
          <p>Add new products to your inventory</p>
          <Link href="/inventory/add">
            <ButtonLink>Add Item</ButtonLink>
          </Link>
        </Card>

        <Card>
          <h3>Low Stock</h3>
          <p>View items that are running low on stock</p>
          <Link href="/inventory/low-stock">
            <ButtonLink>Check Low Stock</ButtonLink>
          </Link>
        </Card>

        <Card>
          <h3>Reports</h3>
          <p>Generate inventory reports and analytics</p>
          <Link href="/reports">
            <ButtonLink>View Reports</ButtonLink>
          </Link>
        </Card>

        <Card>
          <h3>Transactions</h3>
          <p>View sales history and transaction records</p>
          <Link href="/transactions">
            <ButtonLink>View Transactions</ButtonLink>
          </Link>
        </Card>
      </CardGrid>
    </Container>
  );
}
