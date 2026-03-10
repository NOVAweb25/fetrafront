import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "./PaymentSuccess.css";

const PaymentSuccess = () => {
  return (
    <div className="payment-page success">
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
          تم الدفع بنجاح!
        </motion.h1>
        <motion.p
          className="payment-msg"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          شكراً لك، تم استلام دفعتك بنجاح.
        </motion.p>
        <Link to="/my-orders" className="payment-btn">
          عرض طلباتي
        </Link>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;