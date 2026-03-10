import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMyOrders, addToCart, addFavorite } from "../../api/api";
import { Share2 } from "lucide-react";
import BottomNav from "../../components/BottomNav";
import { getUserById, getProductById } from "../../api/api";
import "./MyOrders.css";
const API_BASE = process.env.REACT_APP_API_BASE;
const MyOrders = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [userFavorites, setUserFavorites] = useState([]);
  const [userCart, setUserCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const invoiceIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1763968572/invoice_kkbd8p.svg";
  const closeIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770409276/close_ocjfbw.svg";
  const statuses = [
    "بانتظار تأكيد الطلب",
    "تم تأكيد الطلب",
    "طلبك في الطريق",
    "تم التسليم",
    "جاهز للاستلام",
    "تم رفض الطلب",
  ];
  const getImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_BASE}${path}`;
  };
  const SearchIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1763968618/search_ke1zur.svg";
  const cartIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1763968566/cart_jsj3mh.svg";
  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await getMyOrders(user._id);
      let filtered = res.data;
      if (search.trim()) {
        const digits = search.trim();
        filtered = filtered.filter((o) =>
          o.orderNumber?.toString().includes(digits)
        );
      }
      if (statusFilter) {
        filtered = filtered.filter((o) => o.status === statusFilter);
      }
      filtered = filtered.map((order) => ({
        ...order,
        paymentProof: getImageUrl(order.paymentProof),
      }));
      setOrders(filtered);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (!user?._id) return;
    const fetchUserData = async () => {
      try {
        const res = await getUserById(user._id);
        const userData = res.data;
        const favoritesIds = Array.isArray(userData.favorites)
          ? userData.favorites.map((fav) => fav._id || fav)
          : [];
        setUserFavorites(favoritesIds);
        const cartItems = Array.isArray(userData.cart) ? userData.cart : [];
        setUserCart(cartItems);
      } catch (err) {
        console.error("خطأ أثناء جلب بيانات المستخدم:", err);
      }
    };
    fetchUserData();
  }, [user]);
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (user?._id) loadOrders();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [user, statusFilter, search]);
  const handleAddToCart = async (product) => {
    if (!user?._id) return;
    try {
      const productRes = await getProductById(product._id);
      const freshProduct = productRes.data;
      if (!freshProduct || freshProduct.stock === 0) {
        setAlertMessage("لم يعد متوفر");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 2500);
        return;
      }
      const currentItem = userCart.find((i) => (i.product?._id || i.product) === product._id);
      const currentQty = currentItem ? currentItem.quantity : 0;
      const stock = freshProduct.stock || 0;
      if (currentQty + 1 > stock) {
        setAlertMessage(`لا يمكن إضافة أكثر من ${stock} من "${product.name}"`);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 2500);
        return;
      }
      await addToCart(user._id, {
        product: product._id,
        name: product.name,
        price: product.price,
        mainImage: product.mainImage,
        quantity: 1,
      });
      setAlertMessage(`تمت إضافة "${product.name}" إلى السلة 🛒`);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      window.dispatchEvent(new Event("cartUpdated"));
      const updatedCart = [...userCart];
      if (currentItem) {
        currentItem.quantity += 1;
      } else {
        updatedCart.push({
          product: { _id: product._id },
          quantity: 1,
          name: product.name,
          price: product.price,
          mainImage: product.mainImage,
        });
      }
      setUserCart(updatedCart);
    } catch (err) {
      console.error("❌ خطأ أثناء إضافة المنتج للسلة:", err);
      setAlertMessage("لم يعد متوفر");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
    }
  };
  const handleFavorite = async (product) => {
    if (!user?._id) return;
    try {
      const alreadyFav = userFavorites.includes(product._id);
      if (alreadyFav) {
        await fetch(`${API_BASE}/api/users/${user._id}/favorites/${product._id}`, {
          method: "DELETE",
        });
        setUserFavorites((prev) => prev.filter((id) => id !== product._id));
      } else {
        await addFavorite(user._id, { productId: product._id });
        setUserFavorites((prev) => [...prev, product._id]);
      }
    } catch (err) {
      console.error("❌ خطأ أثناء تحديث المفضلة:", err);
    }
  };
  const handleShareLocation = (coords) => {
    if (!coords || coords.length !== 2) return;
    const lat = coords[1];
    const lng = coords[0];
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    if (navigator.share) {
      navigator.share({
        title: "موقعي",
        text: "موقعي على الخريطة:",
        url,
      });
    } else {
      window.open(url, "_blank");
    }
  };
  const openReceipt = (proofUrl) => {
    if (!proofUrl) return;
    const url = getImageUrl(proofUrl);
    window.open(url, "_blank");
  };
  return (
    <>
      <div className="myorders-page">
        {/* 🔍 شريط البحث والفلاتر */}
        <div className="search-wrapper">
          <div className="search-box">
            <img src={SearchIcon} alt="بحث" className="search-icon" />
            <input
              type="text"
              placeholder="بحث برقم الطلب"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div
            className="filter-box"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {statusFilter || "كل الحالات"}
            {showDropdown && (
              <div className="filter-dropdown">
                {statuses.map((s) => (
                  <div
                    key={s}
                    className={`filter-option ${
                      statusFilter === s ? "active" : ""
                    }`}
                    onClick={() => {
                      setStatusFilter(s);
                      setShowDropdown(false);
                    }}
                  >
                    {s}
                  </div>
                ))}
                <div
                  className={`filter-option ${statusFilter === "" ? "active" : ""}`}
                  onClick={() => {
                    setStatusFilter("");
                    setShowDropdown(false);
                  }}
                >
                  الكل
                </div>
              </div>
            )}
          </div>
        </div>
        {/* 🧾 قائمة الطلبات */}
        <div className="orders-container">
          {isLoading ? (
            <motion.div
              className="loading-bar"
              animate={{ x: ["100%", "-100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          ) : (
            <AnimatePresence>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <motion.div
                    key={order._id}
                    className="order-card"
                    whileHover={{ scale: 1.01 }}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="order-number">#{order.orderNumber}</div>
                    <div
                      className="invoice-circle"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <img src={invoiceIcon} alt="invoice" width={22} />
                    </div>
                    <div className="status-badge">{order.status}</div>
                  </motion.div>
                ))
              ) : (
                <p className="no-orders-text">لا توجد طلبات حالياً</p>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
      {/* 🪟 نافذة التفاصيل */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              className="modal-overlay"
              onClick={(e) => {
                if (e.target.classList.contains("modal-overlay")) {
                  setSelectedOrder(null);
                }
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="invoice-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="invoice-header">
                <h3>فاتورة الطلب #{selectedOrder.orderNumber}</h3>
                <button
                  className="close-btn"
                  onClick={() => setSelectedOrder(null)}
                >
                  <img src={closeIcon} alt="close" className="close-icon-btn" />
                </button>
              </div>
              <div className="invoice-body">
                {selectedOrder.shipping && (
                  <div className="client-section">
                    <h4>بيانات العميل</h4>
                    <p><strong>الاسم:</strong> {selectedOrder.shipping.name}</p>
                    <p><strong>رقم الجوال:</strong> {selectedOrder.shipping.phone}</p>
                    <p>
                      <strong>العنوان:</strong>{" "}
                      {selectedOrder.shipping.city || "غير محدد"} -{" "}
                      {selectedOrder.shipping.district || "غير محدد"}
                    </p>
                    {selectedOrder.shipping.coords &&
                      selectedOrder.shipping.coords.length === 2 && (
                        <div className="map-container">
                          <a
                            href={`https://www.google.com/maps?q=${selectedOrder.shipping.coords[1]},${selectedOrder.shipping.coords[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <iframe
                              title="client-location"
                              className="client-map"
                              width="100%"
                              height="180"
                              style={{ borderRadius: "10px", marginTop: "8px" }}
                              src={`https://www.google.com/maps?q=${selectedOrder.shipping.coords[1]},${selectedOrder.shipping.coords[0]}&hl=ar&z=15&output=embed`}
                              allowFullScreen
                            ></iframe>
                          </a>
                          <button
                            className="share-btn"
                            onClick={() =>
                              handleShareLocation(selectedOrder.shipping.coords)
                            }
                          >
                            <Share2 size={20} />
                            مشاركة
                          </button>
                        </div>
                      )}
                  </div>
                )}
                <div className="invoice-items-section">
                  <h4>المنتجات</h4>
                  {selectedOrder.items.map((item) => {
                    const productId = item.product?._id;
                    const isFav = userFavorites.includes(productId);
                    return (
                      <div key={item._id} className="invoice-item">
                        <img
                          src={getImageUrl(item.product?.mainImage || item.mainImage)}
                          alt={item.product?.name}
                          className="product-img"
                          onError={(e) => (e.target.src = "/fallback.png")}
                        />
                        <div className="product-details">
                          <strong>{item.product?.name || item.name}</strong>
                          <p>
                            الكمية: {item.quantity} × السعر:{" "}
                            {item.product?.price || item.price} ر.س
                          </p>
                        </div>
                        <div className="product-actions">
                          <motion.div
                            whileTap={{ scale: 0.9 }}
                            className="action-btn cart"
                            onClick={() => handleAddToCart(item.product)}
                          >
                            <img src={cartIcon} alt="cart" width={16} />
                          </motion.div>
                          <motion.div
                            whileTap={{ scale: 0.9 }}
                            className={`action-btn heart ${isFav ? "active" : ""}`}
                            onClick={() => handleFavorite(item.product)}
                          >
                            <span className="heart-symbol">
                              {isFav ? "❤" : "♡"}
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="invoice-summary">
                  <p>
                    مجموع المنتجات: <strong>{selectedOrder.subtotal} ر.س</strong>
                  </p>
                  <p>
                    سعر التوصيل: <strong>{selectedOrder.delivery} ر.س</strong>
                  </p>
                  <h4>
                    الإجمالي:{" "}
                    <strong className="total">{selectedOrder.total} ر.س</strong>
                  </h4>
                </div>
                {selectedOrder.paymentProof && (
                  <div className="receipt-box">
                    <p><strong>الإيصال المرفق:</strong></p>
                    <div
                      className="receipt-file"
                      onClick={() => openReceipt(selectedOrder.paymentProof)}
                    >
                      {selectedOrder.paymentProof.split("/").pop()}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {showAlert && (
        <motion.div
          className="cart-alert"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {alertMessage}
        </motion.div>
      )}
      <BottomNav />
    </>
  );
};
export default MyOrders;