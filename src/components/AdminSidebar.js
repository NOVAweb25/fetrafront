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
  const [position, setPosition] = useState(10); // State جديد للموقع (left: position px)
  const sidebarRef = React.useRef(null);
  const API_BASE = process.env.REACT_APP_API_BASE;
  const productIcon =
    "https://res.cloudinary.com/dp1bxbice/image/upload/v1770407014/productMang_pezz4l.svg";
  const accountIcon =
    "https://res.cloudinary.com/dp1bxbice/image/upload/v1770408843/person_zemcya.svg";
  const statsIcon =
    "https://res.cloudinary.com/dp1bxbice/image/upload/v1770406947/dashboard_v8coub.svg";
  const logo =
    "https://res.cloudinary.com/dp1bxbice/image/upload/v1770561234/logo_fetra_lmhd5m.svg";
  const toggleIcon =
    "https://res.cloudinary.com/dp1bxbice/image/upload/v1770409132/back_oumcbi.svg";
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser(); // استدعاء API لتسجيل الخروج
    } catch (err) {
      console.error("خطأ أثناء تسجيل الخروج:", err);
    }
    // 🔥 بث حدث تسجيل الخروج
    window.dispatchEvent(new Event("logout"));
    // 🔥 إغلاق نافذة التأكيد
    setShowLogoutModal(false);
    navigate("/login"); // توجيه إلى صفحة الدخول بعد الخروج
  };

  const loadNotifications = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/orders?status=بانتظار تأكيد الطلب`
      );
      setPendingOrdersCount(res.data.length);
    } catch (err) {
      console.error("خطأ أثناء جلب الطلبات:", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setPosition(window.innerWidth - 250); // ضبط الموقع الأولي على اليمين (right: ~10px)
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // ضبط أولي
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <motion.div
        ref={sidebarRef}
        drag="x" // سحب أفقي فقط
        dragConstraints={{ left: 0, right: window.innerWidth - 240 }} // نطاق: من اليسار لحد اليمين داخل الشاشة
        dragMomentum={false} // ما يتحركش لوحده
        whileDrag={{ scale: 1.05 }} // تصحيح الخطأ: تكبير بسيط أثناء السحب
        onDragEnd={(e, { point }) => {
          // حساب الموقع الجديد (left position)
          const newLeft = point.x - 120; // 120 = نص عرض الـ sidebar عشان يمسك من الوسط
          // حدّد بين 0 و (عرض الشاشة - عرض الـ sidebar)
          setPosition(Math.max(0, Math.min(newLeft, window.innerWidth - 240)));
        }}
        animate={{
          width: isOpen ? 240 : 60,
          height: isOpen ? "auto" : 60,
          borderRadius: isOpen ? "16px" : "50%",
          padding: isOpen ? "12px 8px" : "10px",
          left: position, // غيّرت لـ left بدل right
        }}
        transition={{ duration: 0.4 }}
        style={{
          ...styles.sidebar,
          top: "60px",
          overflow: "hidden",
          cursor: "grab", // يظهر كـ draggable
          position: "fixed", // تأكيد
          right: "auto", // إزالة right عشان ما يتعارضش
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
              <div
                style={styles.menuItem}
                onClick={() => setOpenAdminMenu(!openAdminMenu)}
              >
                <img src={productIcon} alt="Admin" style={styles.icon} />
                <span style={styles.menuText}>إدارة</span>
                <span style={styles.arrow}>
                  {openAdminMenu ? "▲" : "▼"}
                </span>
              </div>
              <AnimatePresence>
                {openAdminMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    style={styles.subMenu}
                  >
                    <Link to="/admin/sections" style={styles.subMenuItem}>
                      إدارة الأقسام
                    </Link>
                    <Link to="/admin/categories" style={styles.subMenuItem}>
                      إدارة التصنيفات
                    </Link>
                    <Link to="/admin/products" style={styles.subMenuItem}>
                      إدارة المنتجات
                    </Link>
                    <div style={{ position: "relative" }}>
                      <Link to="/admin/orders" style={styles.subMenuItem}>
                        إدارة الطلبات
                      </Link>
                      {pendingOrdersCount > 0 && (
                        <span style={styles.badge}>{pendingOrdersCount}</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* حسابي */}
            <div style={styles.menu}>
              <div
                style={styles.menuItem}
                onClick={() => setOpenAccountMenu(!openAccountMenu)}
              >
                <img src={accountIcon} alt="Account" style={styles.icon} />
                <span style={styles.menuText}>حسابي</span>
                <span style={styles.arrow}>
                  {openAccountMenu ? "▲" : "▼"}
                </span>
              </div>
              <AnimatePresence>
                {openAccountMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    style={styles.subMenu}
                  >
                    <Link to="/admin/profile" style={styles.subMenuItem}>
                      إعدادات المسؤول
                    </Link>
                    <Link to="/admin/settings" style={styles.subMenuItem}>
                      إعدادات الدفع
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* خروج */}
            <div
              style={styles.logoutButton}
              onClick={() => setShowLogoutModal(true)}
            >
              تسجيل الخروج
            </div>
          </>
        )}
        {/* ▪️ زر الطي */}
        <div style={styles.toggleButton} onClick={() => setIsOpen(!isOpen)}>
          <img
            src={toggleIcon}
            alt="Toggle"
            style={{ width: "28px", height: "28px" }}
          />
        </div>
      </motion.div>
      {/* ▪️ نافذة تأكيد الخروج */}
      {showLogoutModal && (
        <div style={styles.modalOverlay}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={styles.modal}
          >
            <h3 style={styles.modalTitle}>تأكيد تسجيل الخروج</h3>
            <p style={styles.modalText}>هل أنت متأكد أنك تريد تسجيل الخروج؟</p>
            <div style={styles.modalButtons}>
              <button
                style={{ ...styles.button, background: "#FF7518" }} // ← Orange Mushroom للأزرار الرئيسية
                onClick={handleLogout}
              >
                نعم
              </button>
              <button
                style={{ ...styles.button, background: "#A52A2A" }} // ← Red Fungus للإلغاء
                onClick={() => setShowLogoutModal(false)}
              >
                إلغاء
              </button>
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
    backgroundColor: "rgba(2, 37, 26, 0.35)", // ← Deep Jungle Green #02251A شفاف للخلفية الرئيسية
    borderRadius: "16px",
    border: "1px solid rgba(2, 37, 26, 0.25)", // حدود غامقة
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "12px 8px",
    boxShadow: "0 4px 18px rgba(2, 37, 26, 0.15)", // ظل غابي
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
    background: "#E1B866", // ← Sunlit Yellow للدائرة
    borderRadius: "50%",
    padding: "10px",
    width: "60px",
    height: "60px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { width: "100%", maxWidth: "50px" },
  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    width: "100%",
    padding: "0 0px",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px",
    borderRadius: "30px",
    textDecoration: "none",
    color: "#FFFFFF", // نص أبيض للتباين الجيد
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
    width: "100%",
    transition: "background 0.3s",
    background: "rgba(20, 80, 50, 0.1)", // ← Lush Forest Green خفيف للعناصر الرئيسية
  },
  icon: { width: "30px", height: iconSizes.large },
  menuText: { whiteSpace: "nowrap", flexGrow: 1 },
  arrow: { fontSize: "12px", color: "#4B0082" }, // ← Purple Jungle Bloom للعناصر السحرية مثل الأسهم
  subMenu: {
    display: "flex",
    flexDirection: "column",
    marginRight: "15px",
    marginTop: "4px",
    gap: "6px",
  },
  subMenuItem: {
    color: "#FFFFFF", // نص أبيض للتباين
    background: "rgba(20, 80, 50, 0.35)", // ← Lush Forest Green شفاف للعناصر الفرعية
    textDecoration: "none",
    padding: "8px 12px",
    fontSize: "14px",
    borderRadius: "30px",
    transition: "all 0.2s",
  },
  toggleButton: {
    cursor: "pointer",
    alignSelf: "center",
    marginTop: "8px",
  },
  logoutButton: {
    padding: "5px",
    marginTop: "10px",
    background: "#FF7518", // ← Orange Mushroom للأزرار التشجيعية
    color: "#FFFFFF",
    textAlign: "center",
    borderRadius: "30px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
    transition: "all 0.3s",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(2, 37, 26, 0.5)", // ← Deep Jungle Green شفاف
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  modal: {
    background: "#02251A", // ← Deep Jungle Green للمودال الرئيسي
    padding: "20px",
    borderRadius: "30px",
    width: "90%",
    maxWidth: "320px",
    textAlign: "center",
    boxShadow: "0 6px 20px rgba(2, 37, 26, 0.2)",
  },
  modalTitle: { fontSize: "18px", color: "#4B0082", marginBottom: "10px" }, // ← Purple Jungle Bloom للعناوين
  modalText: { fontSize: "14px", color: "#FFFFFF", marginBottom: "20px" }, // أبيض للنص
  modalButtons: {
    display: "flex",
    justifyContent: "space-between",
    gap: "150px",
  },
  button: {
    flex: 1,
    padding: "5px",
    border: "none",
    borderRadius: "30px",
    color: "#FFFFFF",
    cursor: "pointer",
    fontFamily: fonts.primary,
  },
  badge: {
    position: "absolute",
    top: "-5px",
    right: "10px",
    background: "#A52A2A", // ← Red Fungus للتنبيهات
    color: "#FFFFFF",
    borderRadius: "50%",
    padding: "0px 6px",
    fontSize: "12px",
    minWidth: "18px",
    textAlign: "center",
  },
};