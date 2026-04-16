import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/layouts/Navbar";
import Footer from "./components/layouts/Footer";
import HomePage from "./components/pages/HomePage";
import AboutUs from "./components/pages/AboutUs";
import ContactUs from "./components/pages/ContactUs";
import Start from "./components/pages/start";
import Login from "./components/pages/Login";
import SignUp from "./components/pages/SignUp";
import PlannerDashboard from "./components/pages/PlannerDashboard";
import AdminDashboard from "./components/pages/AdminDashboard";
import ReviewsPage from "./components/pages/ReviewsPage";

function AppContent() {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  const hideNavbarFooter = ["/", "/login", "/signup"].includes(location.pathname.toLowerCase());

  const PrivateRoute = ({ element }) => token ? element : <Navigate to="/login" replace />;
  const PublicRoute = ({ element }) => !token ? element : <Navigate to="/home" replace />;
  const AdminRoute = ({ element }) => token && userRole === "admin" ? element : <Navigate to="/login" replace />;
  const PlannerRoute = ({ element }) => token && userRole === "trip_planner" ? element : <Navigate to="/login" replace />;

  return (
    <div className="d-flex flex-column min-vh-100">
      {!hideNavbarFooter && <Navbar />}
      
      <div className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/home" element={<PrivateRoute element={<HomePage />} />} />
          <Route path="/aboutus" element={<PrivateRoute element={<AboutUs />} />} />
          <Route path="/contactus" element={<PrivateRoute element={<ContactUs />} />} />
          <Route path="/planner-dashboard" element={<PlannerRoute element={<PlannerDashboard />} />} />
          <Route path="/admin" element={<AdminRoute element={<AdminDashboard />} />} />
          <Route path="/reviews" element={<PrivateRoute element={<ReviewsPage />} />} />
          <Route path="/login" element={<PublicRoute element={<Login />} />} />
          <Route path="/signup" element={<PublicRoute element={<SignUp />} />} />
        </Routes>
      </div>

      {!hideNavbarFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
