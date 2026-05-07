import { BrowserRouter as Router } from "react-router";
import AppRoutes from "./AppRoutes";
import { CartProvider } from "./pages/Cartcontext";
import { WishlistProvider } from "./pages/Wishlistcontext";
import { FilterProvider } from "./pages/Filtercontext";



export default function App() {

  return (
    <FilterProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <AppRoutes />
          </Router>
        </WishlistProvider>
      </CartProvider>
    </FilterProvider>
  );
}
