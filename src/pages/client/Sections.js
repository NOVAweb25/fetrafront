import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getSections,
  getCategories,
  getProducts,
  addFavorite,
  addToCart,
  updateCartItem,
  removeFromCart,
  getUserById,
  getProductById,
} from "../../api/api";
import CloseIcon from "../../assets/close.svg";
import "./Sections.css";
import { useNavigate, useLocation } from "react-router-dom";
const API_BASE = process.env.REACT_APP_API_BASE;
const Sections = () => {
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedSection, setExpandedSection] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userFavorites, setUserFavorites] = useState([]);
  const [userCart, setUserCart] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const categoriesRef = useRef(null);
  const [alertMessage, setAlertMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const sectionsRef = useRef(null);
  const SearchIcon =
    "https://res.cloudinary.com/dp1bxbice/image/upload/v1770407020/search_wvv596.svg";
  const CartIcon =
    "https://res.cloudinary.com/dp1bxbice/image/upload/v1770406869/cart_lmsiod.svg";
  const LikeIcon =
    "https://res.cloudinary.com/dp1bxbice/image/upload/v1770408679/like_fuacbx.svg";
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const userId = user?._id || user?.id || null;
  const getImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_BASE}${path}`;
  };
  const normalizeId = (id) => {
    if (!id) return "";
    if (typeof id === "string") return id;
    if (id.$oid) return id.$oid;
    return id.toString();
  };
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getSections();
        const data = res.data.map((s) => ({
          ...s,
          mainImage: s.mainImage?.startsWith("http")
            ? s.mainImage
            : `${API_BASE}${s.mainImage}`,
        }));
        setSections(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await getUserById(userId);
        const u = res.data;
        setUserFavorites(u.favorites?.map((f) => f._id || f) || []);
        setUserCart(u.cart || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [userId]);
  useEffect(() => {
    if (!selectedSection) return;
    (async () => {
      setLoading(true);
      try {
        const res = await getCategories();
        const filtered = res.data.filter(
          (c) => normalizeId(c.section?._id || c.section) === normalizeId(selectedSection._id)
        );
        setCategories(filtered);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedSection]);
  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedSection) return;
      setLoading(true);
      try {
        const res = await getProducts({ sectionId: normalizeId(selectedSection._id) });
        const data = res.data
          .map((p) => ({
            ...p,
            mainImage: getImageUrl(p.mainImage),
            stock: p.stock ?? 0,
          }));
        setProducts(data);
      } catch (err) {
        console.error("Error loading section products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedSection]);
  const handleSectionSelect = (section) => {
    const id = normalizeId(section._id);
    setSelectedSection(section);
    setSelectedCategory(null);
  };
  const handleCategoryClick = async (category) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      const res = await getProducts({
        sectionId: normalizeId(selectedSection._id),
        categoryId: normalizeId(category._id),
      });
      const data = res.data.map((p) => ({
        ...p,
        mainImage: getImageUrl(p.mainImage),
        stock: p.stock ?? 0,
      }));
      setProducts(data);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };
  const loadProducts = async (sectionId, categoryId = null) => {
    setLoading(true);
    try {
      const query = {
        sectionId: normalizeId(sectionId),
        ...(categoryId && { categoryId: normalizeId(categoryId) }),
      };
      const res = await getProducts(query);
      const data = res.data.map((p) => ({
        ...p,
        mainImage: p.mainImage?.startsWith("http")
          ? p.mainImage
          : `${API_BASE}${p.mainImage}`,
        stock: p.stock ?? 0,
      }));
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sectionId = params.get("sectionId");
    const categoryId = params.get("categoryId");
    if (!sectionId || sections.length === 0) return;
    const foundSection = sections.find(
      (s) => normalizeId(s._id) === normalizeId(sectionId)
    );
    if (!foundSection) return;
    setSelectedSection(foundSection);
    (async () => {
      const res = await getCategories();
      const cats = res.data.filter(
        (c) => normalizeId(c.section) === normalizeId(sectionId)
      );
      setCategories(cats);
      if (categoryId) {
        const foundCat = cats.find(
          (c) => normalizeId(c._id) === normalizeId(categoryId)
        );
        if (foundCat) setSelectedCategory(foundCat);
        loadProducts(sectionId, categoryId);
      } else {
        loadProducts(sectionId);
      }
    })();
  }, [sections, location]);
  useEffect(() => {
    const fetchAllProducts = async () => {
      if (selectedSection) return;
      setLoading(true);
      try {
        const res = await getProducts({});
        const data = res.data.map((p) => ({
          ...p,
          mainImage: getImageUrl(p.mainImage),
          stock: p.stock ?? 0,
        }));
        setProducts(data);
      } catch (err) {
        console.error("Error loading all products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllProducts();
  }, [selectedSection]);
  const filteredSections = sections.filter(
    (section) =>
      section.name.toLowerCase().includes(search.toLowerCase()) ||
      section.description?.toLowerCase().includes(search.toLowerCase())
  );
  // ✅ إضافة فلترة للمنتجات بناءً على البحث
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description?.toLowerCase().includes(search.toLowerCase())
  );
  const handleFavorite = async (product) => {
    if (!userId) {
      setShowAuthModal(true);
      return;
    }
    try {
      const alreadyFavorite = userFavorites.includes(product._id);
      if (alreadyFavorite) {
        await fetch(
          `${API_BASE}/users/${userId}/favorites/${product._id}`,
          { method: "DELETE" }
        );
        setUserFavorites((prev) => prev.filter((id) => id !== product._id));
      } else {
        await addFavorite(userId, { productId: product._id });
        setUserFavorites((prev) => [...prev, product._id]);
      }
      window.dispatchEvent(new Event("favoritesUpdated"));
    } catch (err) {
      console.error("❌ Error updating favorites:", err);
    }
  };
  const handleAddToCart = async (product) => {
    if (!userId) {
      setShowAuthModal(true);
      return;
    }
    let stock = 0;
    try {
      const productRes = await getProductById(product._id);
      stock = productRes.data.stock ?? 0;
    } catch (err) {
      console.error("❌ Error fetching product stock:", err);
      setAlertMessage("حدث خطأ أثناء التحقق من المخزون 😔");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return;
    }
    const refreshedUser = await getUserById(userId);
    const freshCart = refreshedUser.data.cart || [];
    const cartItem = freshCart.find(
      (item) =>
        normalizeId(item.product?._id || item.product) === normalizeId(product._id)
    );
    const currentQty = cartItem ? cartItem.quantity : 0;
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
      console.error("❌ Error adding to cart:", err);
      setAlertMessage("حدث خطأ أثناء إضافة المنتج 😔");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
    }
  };
  const handleNotifyInterest = async (product) => {
    if (!userId) {
      setShowAuthModal(true);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/products/${product._id}/notify-interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('فشل في تسجيل الرغبة');
      setAlertMessage(`سوف نعلمك عند توفر "${product.name}" 🔔`);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
    } catch (err) {
      console.error("❌ Error notifying interest:", err);
      setAlertMessage("حدث خطأ أثناء تسجيل الرغبة 😔");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
    }
  };
  const openDetails = (section) => setExpandedSection(section);
  const closeDetails = () => setExpandedSection(null);
  return (
    <div className="sections-container">
      {/* ✅ إضافة شريط بحث لتسهيل التسوق */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="ابحث عن قسم أو منتج..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <img src={SearchIcon} alt="search" className="search-icon" />
      </div>
      {/* ⭐ العنوان + زر الكل */}
      <div className="header-row">
        <motion.h2
          className="page-title"
          initial={{ x: -200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          خدماتنا
        </motion.h2>
        {selectedSection && (
          <div
            className="show-all-button"
            onClick={() => {
              setSelectedSection(null);
              setSelectedCategory(null);
              setCategories([]);
            }}
          >
            الكل
          </div>
        )}
      </div>
      {/* 🧩 الأقسام */}
      <div className="sections-scroll" ref={sectionsRef}>
        {filteredSections.map((section) => (
          <motion.div
            key={section._id}
            className={`section-card ${ selectedSection?._id === section._id ? "selected" : "" }`}
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              setSelectedSection(section);
              setSelectedCategory(null);
            }}
          >
            <div className="section-image-wrapper">
              <img
                src={getImageUrl(section.mainImage)}
                alt={section.name}
                className="section-image"
                onError={(e) => (e.target.src = "/fallback.png")}
              />
            </div>
            <span className="section-name">{section.name}</span>
            <p className="section-description">
              {section.description.length > 40
                ? `${section.description.substring(0, 40)}...`
                : section.description}
            </p>
          </motion.div>
        ))}
      </div>
      {/* 📂 التصنيفات */}
      {selectedSection && (
        <motion.div
          className="categories-scroll"
          ref={categoriesRef}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {categories.map((cat, index) => (
            <motion.div
              key={cat._id}
              className={`category-card ${
                selectedCategory?._id === cat._id ? "selected" : ""
              }`}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat.name}
            </motion.div>
          ))}
        </motion.div>
      )}
      {loading && <div className="loading-bar"></div>}
      {loading && <p className="loading-text">جاري تحميل المنتجات...</p>}
      {/* 🛍️ المنتجات مع الفلترة */}
      {filteredProducts.length > 0 && (
        <motion.div
          className="products-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product._id}
              className={`product-card ${product.stock === 0 ? "out-of-stock" : ""}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <div
                className="product-image-wrapper"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/product/${product._id}`)}
              >
                <img
                  src={getImageUrl(product.mainImage)}
                  alt={product.name}
                  className="product-image"
                  onError={(e) => (e.target.src = "/fallback.png")}
                />
              </div>
              <div className="product-info">
                <span className="product-name">{product.name}</span>
                <span className="product-price">{product.price} ر.س</span>
              </div>
              <div className="product-actions">
                {product.stock === 0 ? (
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="notify-btn"
                    onClick={() => handleNotifyInterest(product)}
                  >
                    <span className="notify-text">🔔 أرغب به</span>
                  </motion.div>
                ) : (
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="action-btn"
                    onClick={() => handleAddToCart(product)}
                  >
                    <img src={CartIcon} alt="cart" />
                  </motion.div>
                )}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`action-btn heart ${userFavorites.includes(product._id) ? "active" : ""}`}
                  onClick={() => handleFavorite(product)}
                >
                  {userFavorites.includes(product._id) ? (
                    <img src={LikeIcon} alt="liked" className="like-icon" />
                  ) : (
                    <span className="heart-symbol">♡</span>
                  )}
                </motion.div>
              </div>
            </motion.div>
          ))}
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
      <AnimatePresence>
        {showAlert && (
          <motion.div
            className="cart-alert top"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {alertMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Sections;