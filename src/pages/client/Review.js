import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Review.css";
import { addReview } from "../../api/api";
const Review = () => {
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const handleSubmit = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!content.trim() || rating === 0) {
      alert("يرجى كتابة رأيك واختيار التقييم.");
      return;
    }
    setSaving(true);
    try {
      await addReview({
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        content,
        rating,
      });
      alert("تم إرسال رأيك بنجاح!");
      setContent("");
      setRating(0);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء إرسال رأيك.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="review-page">
      <motion.div
        className="review-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* 🔹 اسم المستخدم */}
        <div className="name-box">
          {user ? (
            <span>{user.firstName} {user.lastName}</span>
          ) : (
            <span className="placeholder">الاسم (غير مسجّل دخول)</span>
          )}
        </div>
        {/* 🔹 كتابة الرأي */}
        <textarea
          className="review-input"
          placeholder="شاركنا تجربتك.."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
        {/* 🔹 تقييم النجوم */}
        <div className="stars-container">
          {[1, 2, 3, 4, 5].map((num) => (
            <motion.span
              key={num}
              className={`star ${rating >= num ? "active" : ""}`}
              onClick={() => setRating(num)}
              whileTap={{ scale: 0.8 }}
            >
              ★
            </motion.span>
          ))}
        </div>
        {/* 🔹 زر الإرسال */}
        <button className="submit-btn" onClick={handleSubmit} disabled={saving}>
          {saving ? "جاري الإرسال..." : "إرسال"}
        </button>
      </motion.div>
      {/* 🔹 نافذة سجل الآن */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            className="auth-overlay"
            onClick={() => setShowAuthModal(false)} // ⬅️ إغلاق عند النقر بالخارج
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="auth-bottom-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()} // ⬅️ يمنع الإغلاق عند النقر داخل الشيت
            >
              <p className="auth-message">سجّل الآن لتتمكن من كتابة رأيك</p>
              <button
                className="auth-button"
                onClick={() => (window.location.href = "/register")}
              >
                سجّل الآن
              </button>
              <button
                className="auth-close"
                onClick={() => setShowAuthModal(false)}
              >
                إغلاق
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Review;