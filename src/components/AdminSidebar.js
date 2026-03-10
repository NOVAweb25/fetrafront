import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fonts, iconSizes } from "../utils/theme";
import { logoutUser } from "../api/api";
import axios from "axios";

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [openAdminMenu, setOpenAdminMenu] = useState(false);
  const [openAccountMenu, setOpenAccountMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [position, setPosition] = useState(20); // ← بداية من اليسار (20px)

  const sidebarRef = React.useRef(null);
  const API_BASE = process.env.REACT_APP_API_BASE;

  const productIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770407014/productMang_pezz4l.svg";
  const accountIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770408843/person_zemcya.svg";
  const statsIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770406947/dashboard_v8coub.svg";
  const logo = "https://res.cloudinary.com/dp1bxbice/image/upload/v1773124728/Gemini_Generated_Image_hupcf4hupcf4hupc_yndhdc.png";
  const toggleIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770409132/back_oumcbi.svg";

  const navigate = useNavigate();

  // تسجيل الخروج
  const handleLogout = async () => {
    try { await logoutUser(); } catch (err) { console.error(err); }
    window.dispatchEvent(new Event("logout"));
    setShowLogoutModal(false);
    navigate("/login");
  };

  // تحديث عدد الطلبات المعلقة
  const loadNotifications = async () => {
    try {
      const res = await axios.get(`${API_BASE}/orders?status=بانتظار تأكيد الطلب`);
      setPendingOrdersCount(res.data.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // ضبط الموقع عند تغيير حجم الشاشة → دائماً على اليسار
  useEffect(() => {
    const handleResize = () => setPosition(20);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <motion.div
        ref={sidebarRef}
        drag="x"
        dragConstraints={{ left: 0, right: window.innerWidth - 240 }}
        dragMomentum={false}
        whileDrag={{ scale: 1.05 }}
        onDragEnd={(e, { point }) => {
          const newLeft = point.x - 120;
          setPosition(Math.max(0, Math.min(newLeft, window.innerWidth - 240)));
        }}
        animate={{
          width: isOpen ? 240 : 60,
          height: isOpen ? "auto" : 60,
          borderRadius: isOpen ? "16px" : "50%",
          padding: isOpen ? "12px 8px" : "10px",
          left: position,          // ← الموقع الآن من اليسار
        }}
        transition={{ duration: 0.4 }}
        style={{
          ...styles.sidebar,
          top: "60px",
          overflow: "hidden",
          cursor: "grab",
          position: "fixed",
        }}
      >
        {isOpen && (
          <div style={styles.logoContainer}>
            <div style={styles.logoCircle}>
              <img src={logo} alt="Logo" style={styles.logo} />
            </div>
          </div>
        )}

        {isOpen && (
          <>
            <Link to="/admin/stats" style={styles.menuItem}>
              <img src={statsIcon} alt="Stats" style={styles.icon} />
              <span style={styles.menuText}>متابعة الموقع</span>
            </Link>

            {/* إدارة */}
            <div style={styles.menu}>
              <div style={styles.menuItem} onClick={() => setOpenAdminMenu(!openAdminMenu)}>
                <img src={productIcon} alt="Admin" style={styles.icon} />
                <span style={styles.menuText}>إدارة</span>
                <span style={styles.arrow}>{openAdminMenu ? "▲" : "▼"}</span>
              </div>
              <AnimatePresence>
                {openAdminMenu && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={styles.subMenu}>
                    <Link to="/admin/sections" style={styles.subMenuItem}>إدارة الأقسام</Link>
                    <Link to="/admin/categories" style={styles.subMenuItem}>إدارة التصنيفات</Link>
                    <Link to="/admin/products" style={styles.subMenuItem}>إدارة المنتجات</Link>
                    <div style={{ position: "relative" }}>
                      <Link to="/admin/orders" style={styles.subMenuItem}>إدارة الطلبات</Link>
                      {pendingOrdersCount > 0 && <span style={styles.badge}>{pendingOrdersCount}</span>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* حسابي */}
            <div style={styles.menu}>
              <div style={styles.menuItem} onClick={() => setOpenAccountMenu(!openAccountMenu)}>
                <img src={accountIcon} alt="Account" style={styles.icon} />
                <span style={styles.menuText}>حسابي</span>
                <span style={styles.arrow}>{openAccountMenu ? "▲" : "▼"}</span>
              </div>
              <AnimatePresence>
                {openAccountMenu && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={styles.subMenu}>
                    <Link to="/admin/profile" style={styles.subMenuItem}>إعدادات المسؤول</Link>
                    <Link to="/admin/settings" style={styles.subMenuItem}>إعدادات الدفع</Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={styles.logoutButton} onClick={() => setShowLogoutModal(true)}>
              تسجيل الخروج
            </div>
          </>
        )}

        {/* زر الطي */}
        <div style={styles.toggleButton} onClick={() => setIsOpen(!isOpen)}>
          <img src={toggleIcon} alt="Toggle" style={{ width: "28px", height: "28px" }} />
        </div>
      </motion.div>

      {/* نافذة الخروج */}
      {showLogoutModal && (
        <div style={styles.modalOverlay}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={styles.modal}>
            <h3 style={styles.modalTitle}>تأكيد تسجيل الخروج</h3>
            <p style={styles.modalText}>هل أنت متأكد أنك تريد تسجيل الخروج؟</p>
            <div style={styles.modalButtons}>
              <button style={{ ...styles.button, background: "#FF7518" }} onClick={handleLogout}>نعم</button>
              <button style={{ ...styles.button, background: "#A52A2A" }} onClick={() => setShowLogoutModal(false)}>إلغاء</button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;

/* 🎨 الأنماط */
const styles = {
  sidebar: {
    position: "fixed",
    top: 60,
    backdropFilter: "blur(12px)",
    backgroundColor: "rgba(2, 37, 26, 0.35)",
    borderRadius: "16px",
    border: "1px solid rgba(2, 37, 26, 0.25)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "12px 8px",
    boxShadow: "0 4px 18px rgba(2, 37, 26, 0.15)",
    zIndex: 2000,
    fontFamily: fonts.primary,
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: "10px",
  },
  logoCircle: {
    background: "#E1B866",
    borderRadius: "50%",
    padding: "0px",
    width: "60px",
    height: "60px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { 
    width: "100%", 
    height: "100%", 
    objectFit: "cover", 
    borderRadius: "50%" 
  },
  menu: { display: "flex", flexDirection: "column", gap: "6px", width: "100%", padding: "0 0px" },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px",
    borderRadius: "30px",
    textDecoration: "none",
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
    width: "100%",
    background: "rgba(20, 80, 50, 0.1)",
  },
  icon: { width: "30px", height: iconSizes.large },
  menuText: { whiteSpace: "nowrap", flexGrow: 1 },
  arrow: { fontSize: "12px", color: "#4B0082" },
  subMenu: { display: "flex", flexDirection: "column", marginRight: "15px", marginTop: "4px", gap: "6px" },
  subMenuItem: {
    color: "#FFFFFF",
    background: "rgba(20, 80, 50, 0.35)",
    textDecoration: "none",
    padding: "8px 12px",
    fontSize: "14px",
    borderRadius: "30px",
  },
  toggleButton: { cursor: "pointer", alignSelf: "center", marginTop: "8px" },
  logoutButton: {
    padding: "5px",
    marginTop: "10px",
    background: "#FF7518",
    color: "#FFFFFF",
    textAlign: "center",
    borderRadius: "30px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(2, 37, 26, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  modal: {
    background: "#02251A",
    padding: "20px",
    borderRadius: "30px",
    width: "90%",
    maxWidth: "320px",
    textAlign: "center",
    boxShadow: "0 6px 20px rgba(2, 37, 26, 0.2)",
  },
  modalTitle: { fontSize: "18px", color: "#4B0082", marginBottom: "10px" },
  modalText: { fontSize: "14px", color: "#FFFFFF", marginBottom: "20px" },
  modalButtons: { display: "flex", justifyContent: "space-between", gap: "20px" },
  button: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "30px",
    color: "#FFFFFF",
    cursor: "pointer",
  },
  badge: {
    position: "absolute",
    top: "-5px",
    right: "10px",
    background: "#A52A2A",
    color: "#FFFFFF",
    borderRadius: "50%",
    padding: "0px 6px",
    fontSize: "12px",
    minWidth: "18px",
    textAlign: "center",
  },
};