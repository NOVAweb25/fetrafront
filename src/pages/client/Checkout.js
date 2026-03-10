import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getUserById,
  removeFromCart,
  updateUser,
  updateCartItem,
  createOrder,
  uploadPaymentProof,
  createOrderWithProof,
} from "../../api/api";
import BottomNav from "../../components/BottomNav";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import "./Checkout.css";
const API_BASE = process.env.REACT_APP_API_BASE;
const Checkout = () => {
  const userId = JSON.parse(localStorage.getItem("user"))?._id;
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const plusIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770407003/plus_gazgpc.svg";
  const minusIcon= "https://res.cloudinary.com/dp1bxbice/image/upload/v1770406988/minus_hu6beu.svg";
  const editIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770411103/edit_qr0z2r.svg";
  const deleteIcon= "https://res.cloudinary.com/dp1bxbice/image/upload/v1770411122/delete_wfmwpp.svg";
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    location: "",
    latitude: null,
    longitude: null,
    address: "",
    city: "",
    neighborhood: "",
    street: "",
    nearestLandmark: "",
  });
  const [copiedField, setCopiedField] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const navigate = useNavigate();
  const totalProducts = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = 20;
  const total = totalProducts + delivery;
  const PUBLIC_KEY = "pk_test_Q7YDAzTTP2WUQqyLGdHD9vSms6596uWUziq1Xu1x";
  // ✅ تحميل Moyasar SDK dynamically من CDN جديد
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.6/dist/moyasar.umd.min.js';
    script.async = true;
    script.onload = () => console.log('✅ Moyasar SDK loaded');
    script.onerror = () => console.error('❌ Failed to load Moyasar SDK');
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);
  // ✅ تحميل CSS لـ Moyasar dynamically من CDN
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.6/dist/moyasar.css';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  const getImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_BASE}${path}`;
  };
  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);
  const loadUser = async () => {
    const res = await getUserById(userId);
    const data = res.data;
    setUser(data);
    setCart(data.cart || []);
    setEditData({
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      phone: data.phone || "",
      location: data.location || "",
      address: data.address || "",
      city: data.city || "",
      neighborhood: data.neighborhood || "",
      street: data.street || "",
      nearestLandmark: data.nearestLandmark || "",
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    });
    if (
      !data.firstName ||
      !data.lastName ||
      !data.phone ||
      !data.city ||
      !data.neighborhood ||
      !data.street ||
      !data.nearestLandmark
    ) {
      setIsEditing(true);
    }
  };
  const handleRemoveItem = async (itemId) => {
    const updatedCart = cart.filter((item) => item._id !== itemId);
    setCart(updatedCart);
    try {
      await removeFromCart(userId, itemId);
    } catch (err) {
      console.error("Failed to remove from cart:", err);
      await loadUser();
    }
  };
  const handleUpdateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=ar`
          );
          const geoData = await geoRes.json();
          let city = "";
          let neighborhood = "";
          let street = "";
          let nearestLandmark = "";
          if (geoData.address) {
            city = geoData.address.city || geoData.address.town || geoData.address.village || "";
            neighborhood = geoData.address.suburb || geoData.address.neighbourhood || "";
            street = geoData.address.road || "";
            nearestLandmark = geoData.address.amenity || geoData.address.shop || "";
          }
          setEditData({
            ...editData,
            latitude,
            longitude,
            location: link,
            city,
            neighborhood,
            street,
            nearestLandmark,
          });
        } catch (geoErr) {
          console.error("Error fetching address:", geoErr);
          setEditData({
            ...editData,
            latitude,
            longitude,
            location: link,
            city: "",
            neighborhood: "",
            street: "",
            nearestLandmark: "",
          });
        }
      });
    } else {
      alert("المتصفح لا يدعم تحديد الموقع الجغرافي");
    }
  };
  const handleSaveEdit = async () => {
    await updateUser(userId, editData);
    await loadUser();
    setIsEditing(false);
  };
  const updateQuantity = async (itemId, newQty) => {
    if (newQty <= 0) {
      await handleRemoveItem(itemId);
      return;
    }
    const itemIndex = cart.findIndex((i) => i._id === itemId);
    if (itemIndex === -1) return;
    const item = cart[itemIndex];
    const currentQty = item.quantity;
    const stock = item.product?.stock || 0;
    if (newQty > stock) {
      setAlertMessage(`لا يمكنك إضافة أكثر من ${stock} من هذا المنتج`);
      setTimeout(() => setAlertMessage(""), 2500);
      return;
    }
    const updatedCart = [...cart];
    updatedCart[itemIndex] = { ...item, quantity: newQty };
    setCart(updatedCart);
    try {
      await updateCartItem(userId, itemId, { quantity: newQty });
    } catch (err) {
      console.error("Failed to update quantity:", err);
      updatedCart[itemIndex] = { ...item, quantity: currentQty };
      setCart(updatedCart);
      setAlertMessage("حدث خطأ أثناء تحديث الكمية 😔");
      setTimeout(() => setAlertMessage(""), 2500);
    }
  };
  const handlePay = () => {
    if (!user.city || !user.neighborhood || !user.street || !user.nearestLandmark) {
      setAlertMessage("يرجى ملء جميع تفاصيل العنوان قبل الدفع.");
      setIsEditing(true);
      setTimeout(() => setAlertMessage(""), 3000);
      return;
    }
    if (!window.Moyasar) {
      setAlertMessage("خطأ: مكتبة Moyasar لم يتم تحميلها. جرب إعادة تحميل الصفحة.");
      setTimeout(() => setAlertMessage(""), 3000);
      return;
    }
    window.Moyasar.init({
      element: ".moyasar-form",
      amount: total * 100,
      currency: "SAR",
      description: `طلب جديد من ${user.firstName} ${user.lastName}`,
      publishable_api_key: PUBLIC_KEY,
      callback_url: `${API_BASE}/api/payment/callback`,
      methods: ["creditcard"],
      supported_networks: ["visa", "mastercard", "mada"],
      on_completed: async (payment) => {
        console.log("🔔 Payment initiated from Moyasar:", payment);
        if (payment.status === "initiated") {
          try {
            const orderData = {
              user: userId,
              items: cart.map((item) => ({
                product: item.product._id || item.product,
                name: item.name,
                price: item.price,
                mainImage: item.mainImage,
                quantity: item.quantity,
              })),
              shipping: {
                name: `${user.firstName} ${user.lastName}`,
                phone: user.phone,
                city: user.city,
                neighborhood: user.neighborhood,
                street: user.street,
                nearestLandmark: user.nearestLandmark,
                address: `${user.city || ''}, ${user.neighborhood || ''}, ${user.street || ''}, ${user.nearestLandmark || ''}`.trim(),
                coords: [user.longitude, user.latitude],
              },
              subtotal: totalProducts,
              delivery,
              total,
              paymentId: payment.id,
              paymentStatus: "initiated",
            };
            await createOrder(orderData);
            console.log("✅ Order created with pending status");
            setCart([]);
          } catch (err) {
            console.error("Create Order Error:", err);
            setAlertMessage("حدث خطأ أثناء إنشاء الطلب. الرجاء المحاولة مرة أخرى.");
            setTimeout(() => setAlertMessage(""), 3000);
          }
        } else {
          setAlertMessage("فشل في بدء عملية الدفع.");
          setTimeout(() => setAlertMessage(""), 3000);
        }
      },
    });
  };
  return (
    <>
      <div className="checkout-page">
        <motion.div
          className="checkout-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="checkout-header">بياناتي</h2>
          {user && (
            <div className="checkout-box">
              <div
                className="edit-circle"
                onClick={() => setIsEditing(!isEditing)}
              >
                <img src={editIcon} alt="edit" className="small-icon" />
              </div>
              {!isEditing ? (
                <>
                  <p>
                    <b>الاسم:</b> {user.firstName} {user.lastName}
                  </p>
                  <p>
                    <b>رقم الجوال:</b> {user.phone}
                  </p>
                  <p>
                    <b>الموقع:</b>{" "}
                    {user.location ? (
                      <a className="meta-link" href={user.location} target="_blank" rel="noreferrer">
                        عرض على الخريطة
                      </a>
                    ) : (
                      "لم يتم تحديد الموقع"
                    )}
                  </p>
                  {user.city && <p><b>المدينة:</b> {user.city}</p>}
                  {user.neighborhood && <p><b>الحي:</b> {user.neighborhood}</p>}
                  {user.street && <p><b>الشارع:</b> {user.street}</p>}
                  {user.nearestLandmark && <p><b>أقرب معلم:</b> {user.nearestLandmark}</p>}
                  {user.latitude && user.longitude && (
                    <iframe
                      title="map"
                      width="100%"
                      height="200"
                      className="map-iframe"
                      src={`https://maps.google.com/maps?q=${user.latitude},${user.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    ></iframe>
                  )}
                </>
              ) : (
                <div className="edit-area">
                  <input
                    type="text"
                    value={editData.firstName}
                    onChange={(e) =>
                      setEditData({ ...editData, firstName: e.target.value })
                    }
                    placeholder="الاسم الأول"
                    className="edit-input"
                  />
                  <input
                    type="text"
                    value={editData.lastName}
                    onChange={(e) =>
                      setEditData({ ...editData, lastName: e.target.value })
                    }
                    placeholder="الاسم الأخير"
                    className="edit-input"
                  />
                  <input
                    type="text"
                    value={editData.phone}
                    onChange={(e) =>
                      setEditData({ ...editData, phone: e.target.value })
                    }
                    placeholder="رقم الجوال"
                    className="edit-input"
                  />
                  <button className="small-btn" onClick={handleUpdateLocation}>
                    تحديد موقعي الحالي
                  </button>
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) =>
                      setEditData({ ...editData, location: e.target.value })
                    }
                    placeholder="أدخل رابط موقع من Google Maps"
                    className="edit-input"
                  />
                  <input
                    type="text"
                    value={editData.city}
                    onChange={(e) =>
                      setEditData({ ...editData, city: e.target.value })
                    }
                    placeholder="المدينة"
                    className="edit-input"
                  />
                  <input
                    type="text"
                    value={editData.neighborhood}
                    onChange={(e) =>
                      setEditData({ ...editData, neighborhood: e.target.value })
                    }
                    placeholder="الحي"
                    className="edit-input"
                  />
                  <input
                    type="text"
                    value={editData.street}
                    onChange={(e) =>
                      setEditData({ ...editData, street: e.target.value })
                    }
                    placeholder="الشارع"
                    className="edit-input"
                  />
                  <input
                    type="text"
                    value={editData.nearestLandmark}
                    onChange={(e) =>
                      setEditData({ ...editData, nearestLandmark: e.target.value })
                    }
                    placeholder="أقرب معلم"
                    className="edit-input"
                  />
                  {editData.latitude && editData.longitude && (
                    <iframe
                      title="map"
                      width="100%"
                      height="200"
                      className="map-iframe"
                      src={`https://maps.google.com/maps?q=${editData.latitude},${editData.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    ></iframe>
                  )}
                  <button className="small-btn" onClick={handleSaveEdit}>
                    حفظ التعديل
                  </button>
                </div>
              )}
            </div>
          )}
          <h2 className="checkout-header">المنتجات</h2>
          <div className="checkout-box">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={item._id} className="product-card">
                  <img
                    src={getImageUrl(item.mainImage)}
                    alt={item.name}
                    className="product-img"
                    onError={(e) => (e.target.src = "/fallback.png")}
                  />
                  <div className="product-info">
                    <h4>{item.name}</h4>
                    <p>{item.price} ر.س</p>
                    <div className="actions">
                      <button
                        className="qty-btn"
                        onClick={() =>
                          updateQuantity(item._id, item.quantity - 1)
                        }
                      >
                        <img src={minusIcon} alt="-" className="small-icon" />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() =>
                          updateQuantity(item._id, item.quantity + 1)
                        }
                      >
                        <img src={plusIcon} alt="+" className="small-icon" />
                      </button>
                    </div>
                  </div>
                  <img
                    src={deleteIcon}
                    alt="delete"
                    className="delete-icon"
                    onClick={() => handleRemoveItem(item._id)}
                  />
                </div>
              ))
            ) : (
              <p>السلة فارغة</p>
            )}
          </div>
          <h2 className="checkout-header">الملخص</h2>
          <div className="checkout-box">
            <p>سعر المنتجات: {totalProducts} ر.س</p>
            <p>سعر التوصيل: {delivery} ر.س</p>
            <hr />
            <h3>الإجمالي: {total} ر.س</h3>
            <button
              className="confirm-btn"
              onClick={handlePay}
              disabled={submitting}
            >
              {submitting ? "جاري الدفع..." : "ادفع الآن"}
            </button>
          </div>
        </motion.div>
      </div>
      <div className="moyasar-form"></div>
      <BottomNav />
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.4 }}
          >
            {alertMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
export default Checkout;