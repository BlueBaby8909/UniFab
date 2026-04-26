import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { CartProvider } from "./context/CartProvider";
import Header from "./components/layout/Header";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RequestDesigner from "./pages/RequestDesigner";
import Database from "./pages/Database";
import Home from "./pages/Home";
import Footer from "./components/layout/Footer";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import Cart from "./pages/Cart";
import AdminDashboard from "./pages/admin/AdminDashboard";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/"                 element={<Home />} />
            <Route path="/database"         element={<Database />} />
            <Route path="/request-designer" element={<RequestDesigner />} />
            <Route path="/login"            element={<Login />} />
            <Route path="/register"         element={<Register />} />
            <Route path="/upload"           element={<Upload />} />
            <Route path="/dashboard"        element={<Dashboard />} />
            <Route path="/cart"             element={<Cart />} />
            <Route path="/admin"            element={<AdminDashboard />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}