import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "./PaymentFailed.css";

const PaymentFailed = () => {
  return (
    <div className="payment-page failed">
      <motion.div
        className="payment-card"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="payment-title"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          فشل الدفع!
        </motion.h1>
        <motion.p
          className="payment-msg"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          لم يتم تنفيذ العملية. تأكد من بطاقة الدفع أو أعد المحاولة.
        </motion.p>
        <Link to="/checkout" className="payment-btn">
          إعادة المحاولة
        </Link>
      </motion.div>
    </div>
  );
};

export default PaymentFailed;