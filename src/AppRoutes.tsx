import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router";
import AppHeader from "./layout/AppHeader";
import { ScrollToTop } from "./components/common/ScrollToTop";

// Auth Pages
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";

// Core Pages
import Home from "./pages/Dashboard/Home";
const UserProfiles = lazy(() => import("./pages/UserProfiles"));
const Buy = lazy(() => import("./pages/Buy"));
const UserWallet = lazy(() => import("./pages/UserWallet"));
const WithdrawFund = lazy(() => import("./pages/WithdrawFund"));
const Support = lazy(() => import("./pages/Support"));
const RentContainer = lazy(() => import("./pages/RentContainer"));
const ProductDetailsPage = lazy(() => import("./pages/ProductDetailsPage"));
const DepositConfirmation = lazy(() => import("./pages/DepositConfirmation"));

// UI Pages
const Videos = lazy(() => import("./pages/UiElements/Videos"));
const Images = lazy(() => import("./pages/UiElements/Images"));
const Alerts = lazy(() => import("./pages/UiElements/Alerts"));
const Badges = lazy(() => import("./pages/UiElements/Badges"));
const Avatars = lazy(() => import("./pages/UiElements/Avatars"));
const Buttons = lazy(() => import("./pages/UiElements/Buttons"));

// Charts & Tables
const LineChart = lazy(() => import("./pages/Charts/LineChart"));
const BarChart = lazy(() => import("./pages/Charts/BarChart"));
const BasicTables = lazy(() => import("./pages/Tables/BasicTables"));
const FormElements = lazy(() => import("./pages/Forms/FormElements"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/Admin/AdminUsers"));
const ManageSubscription = lazy(() => import("./pages/Admin/ManageSubscription"));
const SellRequests = lazy(() => import("./pages/Admin/ManageWithdrawal"));
const WithdrawBankDetailsForm = lazy(() => import("./pages/Admin/WithdrawBankDetailsForm"));

// Layout & Guards
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import ConditionalHome from "./components/auth/ConditionalHome";

// Fallback
import NotFound from "./pages/OtherPage/NotFound";
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const SellProductPage = lazy(() => import("./pages/SellProductPage"));
const SellerStorePage = lazy(() => import("./pages/Sellerstorepage"));
const CartPage = lazy(() => import("./pages/Cartpage"));
const MyOrdersPage = lazy(() => import("./pages/Myorderspage"));
const OrderDetailPage = lazy(() => import("./pages/Orderdetailpage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const AdminSellerStorePage = lazy(() => import("./pages/AdminSellerStorePage"));
const AdminSellProductPage = lazy(() => import("./pages/AdminSellProductPage"));
// Premium page no longer used
// const PremiumPage = lazy(() => import("./pages/Premiumpage"));
const TrackOrderPage = lazy(() => import("./pages/Trackorderpage"));
// Manual payments (bank transfer / UPI + receipt)
const MyPaymentsPage = lazy(() => import("./pages/MyPaymentsPage"));
const AdminPaymentMethods = lazy(() => import("./pages/Admin/AdminPaymentMethods"));
const AdminPaymentApprovals = lazy(() => import("./pages/Admin/AdminPaymentApprovals"));
const AdminShipments = lazy(() => import("./pages/Admin/AdminShipments"));


// Shown while a page's code downloads (pages load on demand to keep the first visit fast)
function LegacyPrefixRedirect() {
  const { pathname, search, hash } = useLocation();
  const target = pathname.replace(/^\/bandookwale/, "") || "/";
  return <Navigate to={target + search + hash} replace />;
}

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gold-500" />
    </div>
  );
}

export default function AppRoutes() {
  const location = useLocation();

  // Hide header for auth pages
  const hideHeaderRoutes = [
    "/signin",
    "/signup",
  ];

  const shouldHideHeader = hideHeaderRoutes.includes(location.pathname);

  return (
    <>
      <ScrollToTop />

      {/* HEADER */}
      {!shouldHideHeader && <AppHeader />}

      {/* PAGE CONTENT */}

      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />

        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Old links/bookmarks used a /bandookwale prefix — send them to the root-based URL */}
        <Route path="/bandookwale/*" element={<LegacyPrefixRedirect />} />

        {/* PROTECTED ROUTES */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            // Own store
            <Route path="/store" element={<SellerStorePage />} />
            // Any seller's store (from ProductDetailsPage "View Store" button)
            <Route path="/store/:sellerId" element={<SellerStorePage />} />
            <Route path="/track" element={<TrackOrderPage />} />
            {/* Post-login landing: sends admins to /admin, everyone else to /dashboard */}
            <Route path="/home" element={<ConditionalHome />} />
            <Route path="dashboard" element={<Home />} />
            <Route path="/store" element={<SellerStorePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/orders" element={<MyOrdersPage />} />
            {/* Premium page no longer used */}
            {/* <Route path="/premiumPage" element={<PremiumPage />} /> */}
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/payments" element={<MyPaymentsPage />} />
            <Route path="/chat" element={<ChatPage />} />
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
          <Route path="/admin" element={<AppLayout />}>
            <Route path="store" element={<AdminSellerStorePage />} />
            <Route path="sellProductPage" element={<AdminSellProductPage />} />
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="subscription" element={<ManageSubscription />} />
            <Route path="payment-methods" element={<AdminPaymentMethods />} />
            <Route path="payments" element={<AdminPaymentApprovals />} />
            <Route path="shipments" element={<AdminShipments />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>

    </>
  );
}