import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Buy from "./pages/Buy";
import UserWallet from "./pages/UserWallet";
import WithdrawFund from "./pages/WithdrawFund";
import Support from "./pages/Support";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import ConditionalHome from "./components/auth/ConditionalHome";
import ManageRankReward from "./pages/Admin/ManageRankReward";
import ManageIncomeType from "./pages/Admin/ManageIncomeType";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminDeposits from "./pages/Admin/AdminDeposits";
import AdminWalletTransactions from "./pages/Admin/AdminWalletTransactions";
import ManageSubscription from "./pages/Admin/ManageSubscription";
import ManagerWithdrawal from "./pages/Admin/ManageWithdrawal";
import Sell from "./pages/SellContainer"
import RentContainer from "./pages/RentContainer";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Redirect root to sign-in */}
          <Route path="/" element={<Navigate to="/StyloCoin/signin" replace />} />
          
          {/* Auth Layout */}
          <Route path="/StyloCoin/signin" element={<SignIn />} />
          <Route path="/StyloCoin/signup" element={<SignUp />} />

          {/* Protected Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/containerShipment/" element={<AppLayout />}>
              <Route index element={<ConditionalHome />} />
              <Route path="dashboard" element={<Home />} />

            {/* Others Page */}
            <Route path="profile" element={<UserProfiles />} />
            <Route path="buy" element={<Buy/>} />
            <Route path="sell" element={<Sell/>} />
            <Route path="rent" element={<RentContainer/>}/>
           
            <Route path="withdrawFund" element={<WithdrawFund />} />
            <Route path="support" element={<Support />} />
      

            {/* Forms */}
            <Route path="form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="alerts" element={<Alerts />} />
            <Route path="avatars" element={<Avatars />} />
            <Route path="badge" element={<Badges />} />
            <Route path="buttons" element={<Buttons />} />
            <Route path="images" element={<Images />} />
            <Route path="videos" element={<Videos />} />

            {/* Charts */}
            <Route path="line-chart" element={<LineChart />} />
            <Route path="bar-chart" element={<BarChart />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/StyloCoin/admin" element={<AppLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="ranks" element={<ManageRankReward />} />
              <Route path="income-types" element={<ManageIncomeType />} />
              <Route path="subscription" element={<ManageSubscription />} />
              <Route path="withdrawal" element={<ManagerWithdrawal />} />
              <Route path="deposits" element={<AdminDeposits />} />
              <Route path="wallet-transactions" element={<AdminWalletTransactions />} />
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
