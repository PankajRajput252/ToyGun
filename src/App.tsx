import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router";
import AppRoutes from "./AppRoutes";
import { CartProvider } from "./pages/Cartcontext ";


export default function App() {

   return (
    <CartProvider>
    <Router>
      <AppRoutes />
    </Router>
    </CartProvider>
  );
}
