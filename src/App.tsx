import { BrowserRouter as Router } from "react-router";
import AppRoutes from "./AppRoutes";
import { CartProvider } from "./pages/Cartcontext";
import { WishlistProvider } from "./pages/Wishlistcontext";
import { FilterProvider } from "./pages/Filtercontext";
import { ToastProvider } from "./context/ToastContext";



export default function App() {

  return (
    <ToastProvider>
    <FilterProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <AppRoutes />
          </Router>
        </WishlistProvider>
      </CartProvider>
    </FilterProvider>
    </ToastProvider>
  );
}
