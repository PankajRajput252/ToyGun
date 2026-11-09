import { BrowserRouter as Router } from "react-router";
import AppRoutes from "./AppRoutes";
import { CartProvider } from "./pages/Cartcontext";
import { WishlistProvider } from "./pages/Wishlistcontext";
import { FilterProvider } from "./pages/Filtercontext";
import { ToastProvider } from "./context/ToastContext";
import { ChatNotificationProvider } from "./context/ChatNotificationContext";
import VisitTracker from "./components/common/VisitTracker";



export default function App() {

  return (
    <ToastProvider>
    <FilterProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            {/* Inside the router: notifications link to /chat */}
            <ChatNotificationProvider>
              <VisitTracker />
              <AppRoutes />
            </ChatNotificationProvider>
          </Router>
        </WishlistProvider>
      </CartProvider>
    </FilterProvider>
    </ToastProvider>
  );
}
