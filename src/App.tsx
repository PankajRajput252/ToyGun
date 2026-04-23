import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router";
import AppRoutes from "./AppRoutes";

export default function App() {

   return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
