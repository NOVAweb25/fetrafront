import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { colors, fonts, fontSizes, buttonSizes } from "../utils/theme";

const Home = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  
  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      setUser(savedUser);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  
  return (
    <div style={styles.container}>
      {/* 🎥 خلفية الفيديو – اقترح تغييرها إلى فيديو غابي أكثر إذا أمكن */}
      <video autoPlay loop muted playsInline style={styles.video}>
        <source src="https://res.cloudinary.com/dp1bxbice/video/upload/v1770406920/background_yzcuf7.mp4" />
      </video>
      
      {/* 🌫️ الطبقة الشفافة والمحتوى */}
      <div style={styles.overlay}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={styles.contentBox}
        >
          {/* 👋 رسالة ترحيب */}
          <h1 style={styles.title}>
            {user ? ` نوّرت ارضك ${user.firstName}` : " فن يبحث عن صاحبها, تُكمل رحلتك، وتعبّر عن جزءٍ منك, اكتشف ما ينتمي لك"}
          </h1>
          
          {/* 🔗 زر تسجيل الدخول */}
          {!user && (
            <button
              style={styles.button}
              onClick={() => {
                const section = document.getElementById("sections");
                if (section) {
                  section.scrollIntoView({ behavior: "smooth" });
                }
              }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = '#A52A2A'; e.target.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = '#FF7518'; e.target.style.transform = 'scale(1)'; }}
            >
               ابدأ رحلتك
            </button>
          )}
          
          {/* رابط التسجيل */}
          {!user && (
            <p style={styles.text}>
              ليس لديك حساب؟{" "}
              <Link to="/register" style={styles.link}>
                انضم لنا
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Home;

const styles = {
  container: {
    position: "relative",
    width: "100%",
    height: "100vh",
    fontFamily: fonts.primary,
    overflow: "hidden",
  },
  video: {
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: -1,
  },
  overlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "rgba(2, 37, 26, 0.4)", // ← من Deep Jungle Green #02251A لعمق غابي
  },
  contentBox: {
    textAlign: "center",
    backgroundColor: "rgba(20, 80, 50, 0.25)", // ← من Lush Forest Green #145032 بنسبة شفافية
    padding: "30px 40px",
    borderRadius: "30px",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)", // للـ Safari
    boxShadow: "0 8px 20px rgba(20, 80, 50, 0.25)", // ظل أخضر ناعم
    border: "1px solid rgba(20, 80, 50, 0.3)", // حدود خضراء خفيفة
  },
  title: {
    color: "#E1B866", // ← Sunlit Yellow لبريق مشمس جذاب
    fontFamily: fonts.secondary,
    fontSize: fontSizes.title,
    marginBottom: "20px",
  },
  button: {
    ...buttonSizes.medium,
    backgroundColor: "#FF7518", // ← Orange Mushroom لجذب الفعل (CTA)
    color: "#FFFFFF", // أبيض لتباين عالي
    border: "none",
       borderColor: "fff",
    borderRadius: "30px",
    cursor: "pointer",
    display: "inline-block",
    marginTop: "10px",
    transition: "all 0.3s ease", // لتأثير hover سلس
  },
  link: {
    color: "#4B0082", // ← Purple Jungle Bloom لروابط ساحرة تجذب المتابعة
    textDecoration: "underline",
    fontSize: fontSizes.link,
    transition: "color 0.3s ease",
    ':hover': { color: "#A52A2A" }, // hover إلى Red Fungus لإثارة
  },
  text: {
    marginTop: "15px",
    color: "#FFFFFF", // أبيض لقراءة سهلة على خلفية غابية
    fontSize: fontSizes.content,
  },
};