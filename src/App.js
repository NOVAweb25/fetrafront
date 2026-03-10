import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminStats from "./pages/admin/AdminStats";
import Sections from "./pages/client/Sections";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminSections from "./pages/admin/AdminSections";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminBank from "./pages/admin/AdminBank";
import AdminRoute from "./components/AdminRoute";
import Footer from "./components/Footer";
import ClientNavbar from "./components/ClientNavbar";
import BottomNav from "./components/BottomNav";
import Account from "./pages/client/Account";
import Checkout from "./pages/client/Checkout";
import AdminOrders from "./pages/admin/AdminOrders";
import ProductDetails from "./pages/client/ProductDetails";
import MyOrders from "./pages/client/MyOrders";
import Review from "./pages/client/Review";
import PaymentSuccess from "./pages/client/PaymentSuccess";
import PaymentFailed from "./pages/client/PaymentFailed";
import BackgroundMusic from "./components/BackgroundMusic";
import PrivacyPolicy from "./components/PrivacyPolicy"; // استيراد صفحة سياسة الخصوصية
import Terms from "./components/Terms"; // استيراد صفحة الشروط والأحكام
import PaymentPolicy from "./components/PaymentPolicy"; // استيراد صفحة سياسة الدفع
import ReturnPolicy from "./components/ReturnPolicy"; // استيراد صفحة سياسة الاسترجاع والاستبدال
import OrderPolicy from "./components/OrderPolicy"; // استيراد صفحة سياسة الطلب

// ✅ مكوّن لصفحات العميل مع الـ Navbar و Footer
const ClientLayout = ({ children, showBottomNav = false }) => (
  <>
    <ClientNavbar />
    {/* 🎶 موسيقى الخلفية */}
    <BackgroundMusic />
    <div style={{ paddingTop: "75px" }}>
      {children}
    </div>
    {showBottomNav && <BottomNav />}
    <Footer />
  </>
);

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [token, setToken] = useState(localStorage.getItem("token"));
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ الاستماع لتغيرات الدخول والخروج بشكل مركزي
  useEffect(() => {
    const handleAuthChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem("user"));
      const updatedToken = localStorage.getItem("token");
      setUser(updatedUser);
      setToken(updatedToken);
    };
    const handleLogout = () => {
      // 🔹 تأكيد الحذف من التخزين المحلي
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      // 🔹 تحديث الحالة العامة للتطبيق
      setUser(null);
      setToken(null);
      // 🔹 بث حدث عام لتحديث جميع المكونات
      window.dispatchEvent(new Event("authChange"));
      // 🔹 توجيه المستخدم إلى الصفحة الرئيسية بعد الخروج
      navigate("/");
      window.location.reload();
    };
    // 🔹 استماع دائم لتغيرات الحالة
    window.addEventListener("authChange", handleAuthChange);
    window.addEventListener("logout", handleLogout);
    return () => {
      window.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("logout", handleLogout);
    };
  }, [navigate]);

  // ✅ إعادة توجيه تلقائي إذا تم تسجيل الخروج أثناء التواجد في صفحات الإدارة
  useEffect(() => {
    const isAdmin = token && user?.role === "admin";
    if (!isAdmin && location.pathname.startsWith("/admin")) {
      navigate("/");
    }
  }, [user, token, location, navigate]);

  // ✅ الحماية التلقائية لصفحات المدير
  const isAdmin = token && user?.role === "admin";

  return (
    <Routes>
      {/* 🏠 الصفحة الرئيسية */}
      <Route
        path="/"
        element={
          isAdmin ? (
            <Navigate to="/admin/stats" replace />
          ) : (
            <ClientLayout showBottomNav={true}>
              <Home />
              <div id="sections">
                <Sections />
              </div>
              <Review />
            </ClientLayout>
          )
        }
      />
      {/* صفحات عامة */}
      <Route
        path="/login"
        element={
          <ClientLayout>
            <Login />
          </ClientLayout>
        }
      />
      <Route
        path="/register"
        element={
          <ClientLayout>
            <Register />
          </ClientLayout>
        }
      />
      {/* صفحات السياسات (مرتبطة بالفوتر) */}
      <Route
        path="/privacy-policy"
        element={
          <ClientLayout showBottomNav={true}>
            <PrivacyPolicy />
          </ClientLayout>
        }
      />
      <Route
        path="/terms"
        element={
          <ClientLayout showBottomNav={true}>
            <Terms />
          </ClientLayout>
        }
      />
      <Route
        path="/payment-policy"
        element={
          <ClientLayout showBottomNav={true}>
            <PaymentPolicy />
          </ClientLayout>
        }
      />
      <Route
        path="/return-policy"
        element={
          <ClientLayout showBottomNav={true}>
            <ReturnPolicy />
          </ClientLayout>
        }
      />
      <Route
        path="/order-policy"
        element={
          <ClientLayout showBottomNav={true}>
            <OrderPolicy />
          </ClientLayout>
        }
      />
      {/* صفحات المسؤول (محمية) */}
      <Route
        path="/admin/stats"
        element={
          <AdminRoute>
            <AdminStats />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <AdminRoute>
            <AdminProducts />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/sections"
        element={
          <AdminRoute>
            <AdminSections />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <AdminRoute>
            <AdminCategories />
          </AdminRoute>
        }
      />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-failed" element={<PaymentFailed />} />
      <Route
        path="/admin/profile"
        element={
          <AdminRoute>
            <AdminProfile />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminRoute>
            <AdminOrders />
          </AdminRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ClientLayout>
            <Account />
          </ClientLayout>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminRoute>
            <AdminOrders />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminRoute>
            <AdminBank />
          </AdminRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ClientLayout>
            <Checkout />
          </ClientLayout>
        }
      />
      <Route
        path="/my-orders"
        element={
          <ClientLayout>
            <MyOrders />
          </ClientLayout>
        }
      />
      <Route
        path="/product/:id"
        element={
          <ClientLayout showBottomNav={true}>
            <ProductDetails />
          </ClientLayout>
        }
      />
      <Route
        path="/sections"
        element={
          <ClientLayout showBottomNav={true}>
            <Sections />
          </ClientLayout>
        }
      />
    </Routes>
  );
}

// ✅ نغلف التطبيق بـ Router (لأننا استخدمنا useNavigate داخله)
export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}