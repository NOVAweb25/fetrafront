import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  getProductById,
  getUserById,
  addFavorite,
  addToCart,
  removeFavorite,
} from "../../api/api";
import cartIcon from "../../assets/cart.svg";
import arrowIcon from "../../assets/arrow-right.svg";
import "./ProductDetails.css";
import { AnimatePresence } from "framer-motion";
const API_BASE = process.env.REACT_APP_API_BASE;
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [userFavorites, setUserFavorites] = useState([]);
  const [userCart, setUserCart] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?._id || user?.id || null;
  const LikeIcon =
    "https://res.cloudinary.com/dp1bxbice/image/upload/v1770408679/like_fuacbx.svg";
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_BASE}${path}`;
  };
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await getProductById(id);
        const data = res.data;
        data.mainImage = getImageUrl(data.mainImage);
        data.images = (data.images || []).map((img) => getImageUrl(img));
        setProduct(data);
      } catch (err) {
        console.error("Error loading product:", err);
      }
    };
    fetchProduct();
  }, [id]);
  useEffect(() => {
    if (!userId) return;
    const fetchUserData = async () => {
      try {
        const res = await getUserById(userId);
        const userData = res.data;
        const favIds = Array.isArray(userData.favorites)
          ? userData.favorites.map((f) => f._id || f)
          : [];
        setUserFavorites(favIds);
        setUserCart(userData.cart || []);
      } catch (err) {
        console.error("Error loading user data:", err);
      }
    };
    fetchUserData();
  }, [userId]);
  if (!product)
    return <p style={{ textAlign: "center", marginTop: "40px" }}>جاري التحميل...</p>;
  const images = [product.mainImage, ...(product.images || [])].filter(Boolean);
  const handleFavorite = async () => {
    if (!userId) {
      setShowAuthModal(true);
      return;
    }
    try {
      const isFav = userFavorites.includes(product._id);
      if (isFav) {
        await removeFavorite(userId, product._id);
        setUserFavorites((prev) => prev.filter((id) => id !== product._id));
      } else {
        await addFavorite(userId, { productId: product._id });
        setUserFavorites((prev) => [...prev, product._id]);
      }
    } catch (err) {
      console.error("Error updating favorites:", err);
    }
  };
  const handleAddToCart = async () => {
    if (!userId) {
      setShowAuthModal(true);
      return;
    }
    const refreshedUser = await getUserById(userId);
    const freshCart = refreshedUser.data.cart || [];
    const cartItem = freshCart.find(
      (item) =>
        item.product === product._id ||
        item.product?._id === product._id
    );
    const currentQty = cartItem ? cartItem.quantity : 0;
    const stock = product.stock || 0;
    if (currentQty + 1 > stock) {
      setAlertMessage(`لا يمكنك إضافة أكثر من ${stock} من هذا المنتج`);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return;
    }
    try {
      await addToCart(userId, {
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
    } catch (err) {
      console.error("Error adding to cart:", err);
      setAlertMessage("حدث خطأ أثناء إضافة المنتج 😔");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
    }
  };
  return (
    <div className="product-details-container">
      <motion.div
        className="product-card"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="image-gallery">
          <div className="main-image-wrapper">
            <motion.img
              key={currentImage}
              src={getImageUrl(images[currentImage])}
              alt={product.name}
              className="main-image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              onError={(e) => (e.target.src = "/fallback.png")}
            />
          </div>
          {images.length > 1 && (
            <div className="thumbnail-strip">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={getImageUrl(img)}
                  alt="thumb"
                  className={`thumbnail ${currentImage === i ? "active" : ""}`}
                  onClick={() => setCurrentImage(i)}
                  onError={(e) => (e.target.src = "/fallback.png")}
                />
              ))}
            </div>
          )}
        </div>
        <div className="product-header">
          <h2 className="product-name">{product.name}</h2>
          <p className="product-price">{product.price} ر.س</p>
        </div>
        <div className="actions-row">
          {product.stock === 0 ? (
            <motion.div
              className="notify-btn"
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setAlertMessage(`سنعلمك عند توفر "${product.name}" 🔔`);
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 2500);
              }}
            >
              🔔 أرغب به
            </motion.div>
          ) : (
            <motion.div
              className="action-btn"
              whileTap={{ scale: 0.9 }}
              onClick={handleAddToCart}
            >
              <img src={cartIcon} alt="cart" />
            </motion.div>
          )}
          <motion.div
            className={`action-btn heart-btn ${
              userFavorites.includes(product._id) ? "active" : ""
            }`}
            whileTap={{ scale: 0.9 }}
            onClick={handleFavorite}
          >
            <AnimatePresence mode="wait">
              {userFavorites.includes(product._id) ? (
                <motion.img
                  key="liked"
                  src={LikeIcon}
                  alt="liked"
                  className="heart-symbol"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1, rotate: [0, 10, -10, 0] }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3, type: "tween" }}
                />
              ) : (
                <motion.span
                  key="like"
                  className="heart-symbol"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  ♡
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        <p className="product-description">
          {product.description || "لا يوجد وصف متاح."}
        </p>
        {product.section && (
          <div className="breadcrumb inside-card">
            {product.category && (
              <>
                <span
                  className="meta-link"
                  onClick={() =>
                    navigate(
                      `/sections?sectionId=${product.section._id}&categoryId=${product.category._id}`
                    )
                  }
                >
                  {product.category.name}
                </span>
                <img src={arrowIcon} alt=">" className="breadcrumb-arrow" />
              </>
            )}
            <span
              className="meta-link"
              onClick={() =>
                navigate(`/sections?sectionId=${product.section._id}`)
              }
            >
              {product.section.name}
            </span>
          </div>
        )}
      </motion.div>
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
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            className="auth-bottom-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3 }}
          >
            <p className="auth-message">انضم إلينا لتجربة التسوق الكاملة</p>
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
        )}
      </AnimatePresence>
    </div>
  );
};
export default ProductDetails;