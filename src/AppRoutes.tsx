import { Routes, Route, useLocation } from "react-router";
import AppHeader from "./layout/AppHeader";
import { ScrollToTop } from "./components/common/ScrollToTop";

// Auth Pages
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";

// Core Pages
import Home from "./pages/Dashboard/Home";
import UserProfiles from "./pages/UserProfiles";
import Buy from "./pages/Buy";
import UserWallet from "./pages/UserWallet";
import WithdrawFund from "./pages/WithdrawFund";
import Support from "./pages/Support";
import RentContainer from "./pages/RentContainer";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import DepositConfirmation from "./pages/DepositConfirmation";

// UI Pages
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";

// Charts & Tables
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";

// Admin Pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import ManageSubscription from "./pages/Admin/ManageSubscription";
import SellRequests from "./pages/Admin/ManageWithdrawal";
import WithdrawBankDetailsForm from "./pages/Admin/WithdrawBankDetailsForm";

// Layout & Guards
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import ConditionalHome from "./components/auth/ConditionalHome";

// Fallback
import NotFound from "./pages/OtherPage/NotFound";
import WishlistPage from "./pages/WishlistPage";
import SellProductPage from "./pages/SellProductPage";
import SellerStorePage from "./pages/Sellerstorepage";
import CartPage from "./pages/Cartpage";
import MyOrdersPage from "./pages/Myorderspage";
import OrderDetailPage from "./pages/Orderdetailpage";
import ChatPage from "./pages/ChatPage";

export default function AppRoutes() {
  const location = useLocation();

  // Hide header for auth pages
  const hideHeaderRoutes = [
    "/bandookwale/signin",
    "/bandookwale/signup",
  ];

  const shouldHideHeader = hideHeaderRoutes.includes(location.pathname);

  return (
    <>
      <ScrollToTop />

      {/* HEADER */}
      {!shouldHideHeader && <AppHeader />}

      {/* PAGE CONTENT */}

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />

        <Route path="/bandookwale/signin" element={<SignIn />} />
        <Route path="/bandookwale/signup" element={<SignUp />} />

        {/* PROTECTED ROUTES */}
        <Route element={<ProtectedRoute />}>
          <Route path="/bandookwale/" element={<AppLayout />}>
            <Route index element={<ConditionalHome />} />
            <Route path="dashboard" element={<Home />} />
            <Route path="/bandookwale/store" element={<SellerStorePage />} />
            <Route path="/bandookwale/cart" element={<CartPage />} />
            <Route path="/bandookwale/cart" element={<CartPage />} />
            <Route path="/bandookwale/orders" element={<MyOrdersPage />} />
            <Route path="/bandookwale/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/bandookwale/productdetails/bandookwale/chat" element={<ChatPage />} />
            {/* USER FEATURES */}
            <Route path="profile" element={<UserProfiles />} />
            <Route path="productdetails" element={<ProductDetailsPage />} />
            <Route path="wishlistPage" element={<WishlistPage />} />
            <Route path="sellProductPage" element={<SellProductPage />} />
            <Route path="buy" element={<Buy />} />
            <Route path="depositConfirmation" element={<DepositConfirmation />} />
            <Route path="rent" element={<RentContainer />} />
            <Route path="withdrawFund" element={<WithdrawFund />} />
            <Route path="support" element={<Support />} />
            <Route path="wallet" element={<UserWallet />} />

            {/* ADMIN-LIKE (inside dashboard) */}
            <Route path="sell-request" element={<SellRequests />} />
            <Route path="deposit-approval" element={<SellRequests />} />
            <Route path="withdrawls" element={<SellRequests />} />
            <Route path="all-user" element={<AdminUsers />} />
            <Route path="active-user" element={<AdminUsers />} />
            <Route path="inactive-user" element={<AdminUsers />} />
            <Route path="bank-details" element={<WithdrawBankDetailsForm />} />

            {/* UI */}
            <Route path="alerts" element={<Alerts />} />
            <Route path="avatars" element={<Avatars />} />
            <Route path="badge" element={<Badges />} />
            <Route path="buttons" element={<Buttons />} />
            <Route path="images" element={<Images />} />
            <Route path="videos" element={<Videos />} />

            {/* Charts */}
            <Route path="line-chart" element={<LineChart />} />
            <Route path="bar-chart" element={<BarChart />} />

            {/* Tables & Forms */}
            <Route path="basic-tables" element={<BasicTables />} />
            <Route path="form-elements" element={<FormElements />} />
          </Route>
        </Route>

        {/* ADMIN ROUTES (STRICT ADMIN ONLY) */}
        <Route element={<AdminRoute />}>
          <Route path="/bandookwale/admin" element={<AppLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="subscription" element={<ManageSubscription />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

    </>
  );
}