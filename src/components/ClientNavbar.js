import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { logoutUser } from "../api/api";
const ClientNavbar = () => {
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const accountIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770408843/person_zemcya.svg";
  const logo = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770574166/logo_fetra_abjgay.gif";
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) setUser(savedUser);
    // 🔹 عند تغيير بيانات المستخدم في أي مكان داخل الموقع
    const handleAuthChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem("user"));
      setUser(updatedUser || null);
      setShowAuthModal(false);
    };
    // 🔹 عند تسجيل الدخول أو الخروج في أي مكان
    window.addEventListener("authChange", handleAuthChange);
    return () => window.removeEventListener("authChange", handleAuthChange);
  }, []);
  // ✅ إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // ✅ تسجيل الخروج (مُحدّثة)
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout failed:", err);
    }
    // 🔹 حذف بيانات المستخدم من التخزين
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // ✅ إغلاق أي نوافذ مفتوحة
    setShowLogoutModal(false);
    setShowMenu(false);
    // ✅ تحديث الحالة محليًا
    setUser(null);
    // ✅ بث أحداث عامة ليعرف كل الموقع أن العميل خرج
    setTimeout(() => {
      window.dispatchEvent(new Event("authChange"));
      window.dispatchEvent(new Event("logout"));
    }, 50);
    // ✅ توجيه المستخدم للصفحة الرئيسية (اختياري)
    navigate("/");
  };
  // ✅ التعامل مع الزائر
  const handleGuestClick = () => {
    setShowAuthModal(true);
    setShowMenu(false);
  };
  // ✅ الانتقال وإغلاق النافذة فور الضغط
  const handleAuthNavigation = (path) => {
    setShowAuthModal(false);
    navigate(path);
  };
  return (
    <>
      {/* ✅ شريط التنقل */}
      <nav style={styles.navbar}>
        {/* 👤 أيقونة المستخدم في اليسار */}
        <div style={styles.userContainer} ref={menuRef}>
          <div
            style={styles.userButton}
            onClick={() => setShowMenu((prev) => !prev)}
          >
            {user && (
              <motion.span
                style={styles.userName}
                initial={{ x: 0, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {user.firstName} {user.lastName}
              </motion.span>
            )}
            <div style={styles.iconCircle}>
              <img src={accountIcon} alt="Account" style={styles.icon} />
            </div>
          </div>
          {/* 🔽 القائمة المنسدلة */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                style={styles.dropdown}
                initial={{ x: -150, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -150, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  style={styles.dropdownItem}
                  onClick={() =>
                    user ? navigate("/account") : handleGuestClick()
                  }
                >
                  حسابي
                </button>
                <button
                  style={{ ...styles.dropdownItem, position: "relative" }}
                  onClick={() => {
                    user ? navigate("/my-orders") : handleGuestClick();
                  }}
                >
                  طلباتي
                </button>
                {/* ✅ يظهر فقط عند وجود مستخدم */}
                {user && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowLogoutModal(true)}
                    style={styles.logoutButton}
                  >
                    تسجيل الخروج
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* 🟣 الشعار في اليمين */}
        <div style={styles.logoContainer}>
          <div style={styles.logoCircle}>
            <img src={logo} alt="Logo" style={styles.logo} />
          </div>
        </div>
      </nav>
      {/* ✅ نافذة تأكيد تسجيل الخروج */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            style={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={styles.modalContent}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <h3 style={{ color: "#E1B866", marginBottom: "15px" }}>
                هل أنت متأكد من تسجيل الخروج؟
              </h3>
              <div style={styles.modalActions}>
                <button style={styles.confirmButton} onClick={handleLogout}>
                  نعم
                </button>
                <button
                  style={styles.cancelButton}
                  onClick={() => setShowLogoutModal(false)}
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ✅ نافذة الزائر (Bottom Sheet) */}
      <AnimatePresence>
        {showAuthModal && (
          <>
            <motion.div
              style={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
            />
            <motion.div
              style={styles.authSheet}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.35 }}
            >
              <p style={styles.authMessage}>
                انضم الينا لتجربة شراء كاملة
              </p>
              <div style={styles.authActions}>
                <button
                  style={styles.joinButton}
                  onClick={() => handleAuthNavigation("/register")}
                >
                  إنشاء حساب
                </button>
                <button
                  style={styles.loginButton}
                  onClick={() => handleAuthNavigation("/login")}
                >
                  تسجيل دخول
                </button>
              </div>
              <button
                style={styles.closeAuth}
                onClick={() => setShowAuthModal(false)}
              >
                إغلاق
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
export default ClientNavbar;
const styles = {
  navbar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "75px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(2, 37, 26, 0.08)", // ← Deep Jungle Green شفاف لعمق غابي
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(20, 80, 50, 0.15)", // حدود خضراء خفيفة
    boxShadow: "0 4px 12px rgba(20, 80, 50, 0.15)", // ظل غابي
    zIndex: 1000,
    padding: "0 20px", // ← قلل الـ padding اليميني لإعطاء مساحة أكبر
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
  },
  logoCircle: {
    width: "70px",
    height: "70px",
    background: "#E1B866", // ← Sunlit Yellow لبريق مشمس جذاب
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    //boxShadow: "0 0 25px #FF7518", // ظل برتقالي حيوي
  },
  logo: {
    width: "100%",
    height: "auto",
    borderRadius: "50%",
  },
  userContainer: {
    display: "flex",
    alignItems: "center",
  },
  userButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    color: "#145032", // ← Lush Forest Green للنصوص الرئيسية
  },
  iconCircle: {
    width: "42px",
    height: "42px",
    background: "rgba(20, 80, 50, 0.15)", // ← Lush Forest Green شفاف
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 0 10px rgba(225, 184, 102, 0.2)", // ظل أصفر خفيف
  },
  icon: {
    width: "55px",
    height: "55px",
  },
  userName: {
    color: "#E1B866", // ← Sunlit Yellow لاسم المستخدم جذاب
    fontSize: "1rem",
    maxWidth: "calc(100vw - 160px)", // ← عرض ديناميكي بناءً على عرض الشاشة (logo + icon + padding)
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  dropdown: {
    position: "absolute",
    top: "70px",
    left: "50px", // ← حركها شوي لليسار لتكون أكثر وضوحًا
    background: "#02251A", // ← Deep Jungle Green غامق للقائمة
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(20, 80, 50, 0.15)", // ظل غابي
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    width: "180px",
    zIndex: 1200,
  },
  dropdownItem: {
    border: "none",
    background: "transparent",
    textAlign: "right",
    fontSize: "1rem",
    padding: "10px 8px",
    cursor: "pointer",
    color: "#E1B866", // ← Sunlit Yellow للنصوص في القائمة
    transition: "color 0.3s ease",
    ':hover': { color: "#FF7518" }, // hover برتقالي حيوي
  },
  logoutButton: {
    marginTop: "10px",
    padding: "8px 15px",
    border: "none",
    borderRadius: "30px",
    background: "#FF7518", // ← Orange Mushroom لزر الخروج CTA
    color: "#FFFFFF", // أبيض لتباين
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.3s ease",
    ':hover': { background: "#A52A2A" }, // hover أحمر للإثارة
  },
  notificationBubble: {
    position: "absolute",
    top: "5px",
    left: "12px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    backgroundColor: "#4B0082", // ← Purple Jungle Bloom للإشعارات
    borderRadius: "8px",
    padding: "4px 8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    maxWidth: "160px",
  },
  notificationIcon: {
    backgroundColor: "#4B0082",
    color: "#FFFFFF",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "11px",
  },
  notificationText: {
    color: "#E1B866", // ← Sunlit Yellow للنصوص
    fontSize: "0.75rem",
    fontWeight: "600",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(2, 37, 26, 0.5)", // ← Deep Jungle Green شفاف للـ overlay
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  modalContent: {
    color: "#E1B866", // ← Sunlit Yellow للنصوص في المودال
    background: "#145032", // ← Lush Forest Green لخلفية المودال
    padding: "30px",
    borderRadius: "30px",
    textAlign: "center",
    width: "300px",
    boxShadow: "0 8px 20px rgba(2, 37, 26, 0.25)", // ظل غابي
  },
  modalActions: {
    marginTop: "15px",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
  },
  confirmButton: {
    backgroundColor: "#FF7518", // ← Orange Mushroom لزر التأكيد CTA
    color: "#FFFFFF",
    border: "none",
    borderRadius: "30px",
    cursor: "pointer",
    fontWeight: "bold",
    padding: "10px 20px",
    transition: "background 0.3s ease",
    ':hover': { background: "#A52A2A" }, // hover أحمر
  },
  cancelButton: {
    backgroundColor: "#E1B866", // ← Sunlit Yellow لزر الإلغاء
    color: "#02251A",
    border: "none",
    borderRadius: "30px",
    cursor: "pointer",
    padding: "10px 20px",
    transition: "background 0.3s ease",
    ':hover': { background: "#145032" }, // hover أخضر غامق
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 37, 26, 0.4)", // ← Deep Jungle Green شفاف
    zIndex: 1500,
  },
  authSheet: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
    background: "#145032", // ← Lush Forest Green لخلفية الشيت
    borderTopLeftRadius: "30px",
    borderTopRightRadius: "30px",
    boxShadow: "0 -4px 15px rgba(2, 37, 26, 0.15)", // ظل غابي
    padding: "25px",
    textAlign: "center",
    zIndex: 1600,
  },
  authMessage: {
    color: "#E1B866", // ← Sunlit Yellow للرسالة جذابة
    fontSize: "1.1rem",
    fontWeight: "600",
    marginBottom: "15px",
  },
  authActions: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  joinButton: {
    background: "#FF7518", // ← Orange Mushroom لزر إنشاء حساب CTA
    border: "none",
    color: "#FFFFFF",
    fontWeight: "600",
    borderRadius: "30px",
    padding: "10px 18px",
    cursor: "pointer",
    transition: "background 0.3s ease",
    ':hover': { background: "#A52A2A" }, // hover أحمر
  },
  loginButton: {
    background: "#E1B866", // ← Sunlit Yellow لزر تسجيل الدخول
    border: "none",
    color: "#02251A",
    fontWeight: "600",
    borderRadius: "30px",
    padding: "10px 18px",
    cursor: "pointer",
    transition: "background 0.3s ease",
    ':hover': { background: "#145032" }, // hover أخضر غامق
  },
  closeAuth: {
    background: "transparent",
    border: "none",
    color: "#4B0082", // ← Purple Jungle Bloom لزر الإغلاق
    marginTop: "5px",
    cursor: "pointer",
    transition: "color 0.3s ease",
    ':hover': { color: "#A52A2A" }, // hover أحمر
  },
};