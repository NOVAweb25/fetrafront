import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { loginUser } from "../api/api";
import { colors, fonts, fontSizes, buttonSizes } from "../utils/theme";

const Login = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  const [hoverBack, setHoverBack] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const backgroundVideo = "https://res.cloudinary.com/dp1bxbice/video/upload/v1770408547/login_lp7jjm.mp4";
  const backIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770406972/home_jgi9rf.svg";

  useEffect(() => {
    return () => {
      // يلغي أي تايمر قبل مغادرة الصفحة
      setAlertMessage("");
    };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const showAlert = (msg) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(""), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ✅ تحقق من الحقول قبل الإرسال
    if (!form.username.trim()) {
      showAlert("⚠️ يرجى كتابة اسم المستخدم");
      return;
    }
    if (!form.password.trim()) {
      showAlert("⚠️ يرجى تسجيل كلمة المرور");
      return;
    }
    try {
      const res = await loginUser(form);
      const user = res.data.user;
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("authChange"));
      if (user.role === "admin") {
        navigate("/admin/stats");
      } else {
        navigate("/");
      }
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message || "";
        // ✅ مطابقة رسائل الكنترول
        if (status === 404 || message.includes("User not found")) {
          showAlert("! اسم المستخدم أو كلمة المرور غير صحيحة");
        } else if (status === 401 || message.includes("Invalid credentials")) {
          showAlert("! اسم المستخدم أو كلمة المرور غير صحيحة");
        } else {
          showAlert("! حدث خطأ أثناء تسجيل الدخول");
        }
      } else {
        showAlert("لا يمكن الاتصال بالخادم الآن");
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* 🎥 خلفية فيديو */}
      <video autoPlay loop muted playsInline style={styles.video}>
        <source src={backgroundVideo} type="video/mp4" />
      </video>

      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={styles.toast}
          >
            {alertMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🪟 كارت تسجيل الدخول */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        style={styles.card}
      >
        {/* 🔙 زر العودة */}
        <Link
          to="/"
          style={{
            ...styles.back,
            backgroundColor: hoverBack ? '#02251A' : '#145032', // ← Lush Forest Green أساسي، hover غامق
          }}
          onMouseEnter={() => setHoverBack(true)}
          onMouseLeave={() => setHoverBack(false)}
        >
          <img
            src={backIcon}
            alt="Back"
            style={{
              ...styles.backIcon,
              transform: hoverBack ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          />
          <span>عودة</span>
        </Link>

        <h2 style={styles.title}>تسجيل الدخول</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            name="username"
            placeholder="اسم المستخدم"
            value={form.username}
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            type="password"
            name="password"
            placeholder="كلمة المرور"
            value={form.password}
            onChange={handleChange}
            required
            style={styles.input}
          />
          {/* زر حديث مع أنيميشن */}
          <motion.button
            type="submit"
            style={styles.button}
            whileHover={{ scale: 1.05, backgroundColor: '#A52A2A' }} // hover أحمر
            whileTap={{ scale: 0.95 }}
          >
            دخول
          </motion.button>
        </form>

        {/* 📌 رابط التسجيل */}
        <div style={styles.registerText}>
          ليس لديك حساب؟{" "}
          <Link to="/register" style={styles.registerLink}>
            أنشئ حساب
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

const styles = {
  container: {
    position: "relative",
    width: "100%",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: fonts.primary,
    overflow: "hidden",
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: -1,
  },
  card: {
    background: "rgba(20, 80, 50, 0.22)", // ← Lush Forest Green #145032 مع شفافية زجاجية
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    padding: "30px 20px",
    borderRadius: "16px",
    textAlign: "center",
    width: "90%",
    maxWidth: "340px",
    boxShadow: "0 8px 24px rgba(2, 37, 26, 0.35)", // ظل غامق غابي
    position: "relative",
    zIndex: 1,
    border: "1px solid rgba(20, 80, 50, 0.35)", // حدود خضراء خفيفة
  },
  toast: {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#A52A2A", // ← Red Fungus للتنبيهات
    color: "#FFFFFF",
    padding: "10px 20px",
    borderRadius: "30px",
    fontWeight: "600",
    fontSize: "14px",
    boxShadow: "0 4px 12px rgba(2, 37, 26, 0.2)", // ظل غابي
    zIndex: 2000,
  },
  title: {
    fontFamily: fonts.secondary,
    color: "#E1B866", // ← Sunlit Yellow للعنوان جذاب
    fontSize: fontSizes.title,
    marginBottom: "20px",
  },
  form: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "12px" 
  },
  input: {
    padding: "12px",
    borderRadius: "30px",
    border: "1px solid #145032", // ← Lush Forest Green للحدود
    outline: "none",
    fontSize: fontSizes.content,
    fontFamily: fonts.primary,
    backgroundColor: "#02251A", // ← Deep Jungle Green للخلفية غامقة
    color: "#E1B866", // نص أصفر للقراءة
    transition: "border 0.3s ease",
    ':focus': { border: "1px solid #FF7518" } // focus برتقالي
  },
  button: {
    ...buttonSizes.medium,
    width: "100%",
    backgroundColor: "#FF7518", // ← Orange Mushroom للزر CTA
    color: "#FFFFFF",
    border: "none",
    borderRadius: "30px",
    cursor: "pointer",
    marginTop: "10px",
    transition: "all 0.3s ease",
  },
  registerText: {
    marginTop: "18px",
    fontSize: fontSizes.link,
    color: "#FFFFFF", // أبيض للنص
    lineHeight: 1.4,
  },
  registerLink: {
    color: "#4B0082", // ← Purple Jungle Bloom للرابط ساحر
    fontWeight: "bold",
    textDecoration: "underline",
    transition: "color 0.3s ease",
    ':hover': { color: "#A52A2A" } // hover أحمر للإثارة
  },
  back: {
    position: "absolute",
    top: "8px",
    right: "8px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    borderRadius: "30px",
    cursor: "pointer",
    textDecoration: "none",
    color: "#FFFFFF", // نص أبيض
    fontWeight: "bold",
    fontSize: "14px",
    backgroundColor: "#145032", // ← Lush Forest Green أساسي
    transition: "all 0.3s ease",
  },
  backIcon: {
    width: "20px",
    height: "20px",
    transition: "transform 0.3s",
  },
};