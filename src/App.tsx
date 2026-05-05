import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router";
import AppRoutes from "./AppRoutes";
import { CartProvider } from "./pages/Cartcontext";
import { WishlistProvider } from "./pages/Wishlistcontext";


export default function App() {

   return (
       <CartProvider>
      <WishlistProvider>
        <Router>
          <AppRoutes />
        </Router>
      </WishlistProvider>
   </CartProvider>
  );
}
