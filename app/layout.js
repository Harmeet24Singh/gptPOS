import StyledComponentsRegistry from "./lib/registry";
import Navigation from "./components/Navigation";
import { GlobalStyle } from "./styles/globalStyles";
import { AuthProvider } from "./lib/auth";

export const metadata = {
  title: "Convenience Store Inventory",
  description: "Inventory Management System for Convenience Stores",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <GlobalStyle />
          <AuthProvider>
            <Navigation />
            <main>{children}</main>
          </AuthProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
