import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, animate, useTransform, useDragControls } from "framer-motion";
import {
  getCurrentUser,
  removeFromCart,
  updateCartItem,
  removeFavorite,
  addToCart,
} from "../api/api";
import cartAddIcon from "../assets/cart.svg";
import { useNavigate } from "react-router-dom";
import { PanelTopClose, PanelRightClose } from "lucide-react";
import "./BottomNav.css";
const plusIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770407003/plus_gazgpc.svg";
const minusIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770406988/minus_hu6beu.svg";
const trashIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770411122/delete_wfmwpp.svg";
const BottomNav = () => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [total, setTotal] = useState(0);
  const [alertMessage, setAlertMessage] = useState("");
  const [loading, setLoading] = useState(true);
   
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);
  const navigate = useNavigate();
  const [layoutMode, setLayoutMode] = useState("vertical");
  const homeIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770406972/home_jgi9rf.svg";
  const favIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770408679/like_fuacbx.svg";
  const cartIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770406869/cart_lmsiod.svg";
  const API_BASE = process.env.REACT_APP_API_BASE;
  const CLOUDINARY_BASE = process.env.REACT_APP_CLOUDINARY_BASE;
  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url; // رابط Cloudinary
    return `${API_BASE}${url}`; // رابط من السيرفر
  };
  // 🟢 جلب بيانات المستخدم الحالي
  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await getCurrentUser();
      setUser(res.data);
      setCart(Array.isArray(res.data.cart) ? res.data.cart : []);
      setFavorites(Array.isArray(res.data.favorites) ? res.data.favorites : []);
    } catch (err) {
      console.error("Error fetching current user:", err);
      setUser(null);
      setCart([]);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCurrentUser();
  }, []);
  // تحديث عند تغيير السلة أو المفضلة من مكان آخر
  useEffect(() => {
    const handleUpdate = () => fetchCurrentUser();
    window.addEventListener("cartUpdated", handleUpdate);
    window.addEventListener("favoritesUpdated", handleUpdate);
    return () => {
      window.removeEventListener("cartUpdated", handleUpdate);
      window.removeEventListener("favoritesUpdated", handleUpdate);
    };
  }, []);
  // حساب الإجمالي
  useEffect(() => {
    const totalPrice = cart.reduce((sum, item) => {
      const price =
        typeof item.price === "object"
          ? Number(item.price.$numberInt)
          : item.price;
      const qty =
        typeof item.quantity === "object"
          ? Number(item.quantity.$numberInt)
          : item.quantity;
      return sum + price * qty;
    }, 0);
    setTotal(totalPrice);
  }, [cart]);
  useEffect(() => {
    const handleResize = () => setScreenHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // تعديل الكمية
  const updateQuantity = async (itemId, newQty) => {
    if (!user) return;
    if (newQty <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    // 🔥 إيجاد المنتج في السلة
    const itemIndex = cart.findIndex((i) => getItemId(i._id) === itemId);
    if (itemIndex === -1) return;
    const item = cart[itemIndex];
    const currentQty = item.quantity;
    // 🔥 المخزون الحقيقي (من populate)
    const stock =
      item.product?.stock ||
      (typeof item.stock === "object"
        ? Number(item.stock.$numberInt)
        : item.stock) ||
      0;
    // إذا حاول يزيد أكثر من المخزون → منع (فقط عند الزيادة)
    if (newQty > currentQty && newQty > stock) {
      setAlertMessage(` لا يمكن طلب أكثر من ${stock} للمنتج "${item.name}"`);
      setTimeout(() => setAlertMessage(""), 2500);
      return;
    }
    // ✅ تحديث محلي سلس (optimistic update) للكمية والإجمالي فورًا
    const updatedCart = [...cart];
    updatedCart[itemIndex] = { ...item, quantity: newQty };
    setCart(updatedCart); // يحدث الـ UI فورًا بدون إعادة تحميل
    try {
      await updateCartItem(user._id, itemId, { quantity: newQty });
      // ✅ بعد نجاح الـ API، يمكن إعادة جلب إذا لزم (لكن مش ضروري للسلاسة)
      // await fetchCurrentUser(); // أزل هذا لتجنب إعادة التحميل، اعتمد على التحديث المحلي
    } catch (err) {
      console.error("Failed to update quantity:", err);
      // ✅ إذا فشل، عودة للقيمة القديمة (rollback)
      updatedCart[itemIndex] = { ...item, quantity: currentQty };
      setCart(updatedCart);
      setAlertMessage("حدث خطأ أثناء تحديث الكمية 😔");
      setTimeout(() => setAlertMessage(""), 2500);
    }
  };
  // حذف من السلة
  const handleRemoveFromCart = async (itemId) => {
    if (!user) return;
    // ✅ تحديث محلي سلس: إزالة العنصر فورًا
    const updatedCart = cart.filter((i) => getItemId(i._id) !== itemId);
    setCart(updatedCart);
    try {
      await removeFromCart(user._id, itemId);
      // await fetchCurrentUser(); // أزل للسلاسة
    } catch (err) {
      console.error("Failed to remove from cart:", err);
      // rollback إذا فشل (لكن نادر)
      await fetchCurrentUser(); // فقط إذا فشل، أعد جلب
    }
  };
  // حذف من المفضلة
  const handleRemoveFavorite = async (productId) => {
    if (!user) return;
    // ✅ تحديث محلي سلس
    const updatedFavorites = favorites.filter((f) => getItemId(f._id) !== productId);
    setFavorites(updatedFavorites);
    try {
      await removeFavorite(user._id, productId);
    } catch (err) {
      console.error("Failed to remove favorite:", err);
      await fetchCurrentUser();
    }
  };
  // إضافة من المفضلة إلى السلة
  const handleAddToCart = async (product) => {
    if (!user) {
      showAlert("يرجى تسجيل الدخول أولاً");
      return;
    }
    const productId = getItemId(product._id);
    const currentItemIndex = cart.findIndex((i) => getItemId(i.product?._id || i.product) === productId);
    const currentQty = currentItemIndex !== -1 ? cart[currentItemIndex].quantity : 0;
    const stock = product.stock || 0;
    if (currentQty + 1 > stock) {
      showAlert(` لا يمكن طلب أكثر من ${stock} للمنتج "${product.name}"`);
      return;
    }
    // ✅ تحديث محلي سلس: إضافة أو زيادة الكمية فورًا
    const updatedCart = [...cart];
    if (currentItemIndex !== -1) {
      updatedCart[currentItemIndex] = {
        ...updatedCart[currentItemIndex],
        quantity: currentQty + 1,
      };
    } else {
      updatedCart.push({
        product: productId,
        name: product.name,
        price: typeof product.price === "object" ? Number(product.price.$numberInt) : product.price,
        mainImage: product.mainImage,
        quantity: 1,
      });
    }
    setCart(updatedCart);
    try {
      await addToCart(user._id, {
        product: productId,
        name: product.name,
        price:
          typeof product.price === "object"
            ? Number(product.price.$numberInt)
            : product.price,
        mainImage: product.mainImage,
        quantity: 1,
      });
      showAlert("تمت إضافة المنتج إلى السلة");
    } catch (err) {
      console.error("Failed to add to cart:", err);
      showAlert("فشل في إضافة المنتج");
      // rollback
      await fetchCurrentUser();
    }
  };
  const showAlert = (msg) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(""), 2000);
  };
  const getItemId = (id) => {
    if (!id) return null;
    if (typeof id === "string") return id;
    if (id.$oid) return id.$oid;
    if (id.toString) return id.toString();
    return String(id);
  };
  // 🔹 الشريط السفلي
  return (
    <>
      <motion.div
        style={{
          ...styles.navbar(layoutMode),
        }}
      >
        {/* زر الرئيسية */}
        <motion.button
          style={styles.iconBtn}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setActiveModal(null);
            navigate("/");
          }}
        >
          <img src={homeIcon} alt="Home" style={styles.icon} />
        </motion.button>
        {/* زر السلة */}
        <motion.button
          style={styles.iconBtn}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setActiveModal("cart");
            fetchCurrentUser();
          }}
        >
          <img src={cartIcon} alt="Cart" style={styles.icon} />
          {cart.length > 0 && <span style={styles.badge}>{cart.length}</span>}
        </motion.button>
        {/* زر المفضلة */}
        <motion.button
          style={styles.iconBtn}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setActiveModal("fav");
            fetchCurrentUser();
          }}
        >
          <img src={favIcon} alt="Favorite" style={styles.bigFavIcon} />
        </motion.button>
        {/* زر تغيير الاتجاه */}
        <motion.button
          style={styles.iconBtn}
          whileTap={{ scale: 0.9 }}
          onClick={() =>
            setLayoutMode((prev) =>
              prev === "vertical" ? "horizontal" : "vertical"
            )
          }
        >
          {layoutMode === "vertical" ? (
            <PanelRightClose size={26} color="#E1B866" /> // ← Sunlit Yellow للأيقونة
          ) : (
            <PanelTopClose size={26} color="#E1B866" />
          )}
        </motion.button>
      </motion.div>
      {/* 🛒 نافذة السلة */}
      <AnimatePresence>
        {activeModal === "cart" && (
          <>
            <CartSheet
              cart={cart}
              loading={loading}
              total={total}
              screenHeight={screenHeight}
              setActiveModal={setActiveModal}
              updateQuantity={updateQuantity}
              handleRemoveFromCart={handleRemoveFromCart}
              navigate={navigate}
              getItemId={getItemId}
              getImageUrl={getImageUrl}
            />
          </>
        )}
      </AnimatePresence>
      {/* ❤️ نافذة المفضلة */}
      <AnimatePresence>
        {activeModal === "fav" && (
          <>
            <FavSheet
              favorites={favorites}
              loading={loading}
              screenHeight={screenHeight}
              setActiveModal={setActiveModal}
              handleAddToCart={handleAddToCart}
              handleRemoveFavorite={handleRemoveFavorite}
              getItemId={getItemId}
              getImageUrl={getImageUrl}
            />
          </>
        )}
      </AnimatePresence>
      {/* 🔔 Toast */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            style={styles.toast}
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
const CartSheet = ({ cart, loading, total, screenHeight, setActiveModal, updateQuantity, handleRemoveFromCart, navigate, getItemId, getImageUrl }) => {
  const sheetY = useMotionValue(0);
  const opacity = useTransform(sheetY, [0, screenHeight], [0.45, 0]);
  const paddingBottom = useTransform(sheetY, (y) => y);
  const controls = useDragControls();
  return (
    <>
      <motion.div
        style={{ ...styles.overlay, opacity }}
        onClick={() => setActiveModal(null)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        style={{ ...styles.sheet, maxHeight: "100vh", y: sheetY }}
        initial={{ y: screenHeight }}
        animate={{ y: 0 }}
        exit={{ y: screenHeight }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        drag="y"
        dragListener={false}
        dragControls={controls}
        dragConstraints={{ top: 0, bottom: screenHeight }}
        dragElastic={0.2}
        onDragEnd={(_, { velocity }) => {
          const currentY = sheetY.get();
          const snapPoints = [0, screenHeight * 0.5, screenHeight];
          const closest = snapPoints.reduce((prev, curr) =>
            Math.abs(curr - currentY) < Math.abs(prev - currentY) ? curr : prev
          );
          if (velocity.y > 500 || closest >= screenHeight) {
            setActiveModal(null);
          } else {
            animate(sheetY, closest, { type: "spring", stiffness: 300, damping: 30 });
          }
        }}
      >
        <div
          onPointerDown={(e) => controls.start(e)}
          style={styles.handle}
        />
        <h3 style={styles.title}>سلتي ({cart.length})</h3>
        <div style={{ ...styles.scroll, paddingBottom }}>
          {loading ? (
            <motion.div
              style={styles.loadingBar}
              animate={{ x: ["100%", "-100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          ) : cart.length === 0 ? (
            <p style={styles.emptyText}>السلة فارغة</p>
          ) : (
            cart.map((item) => {
              const price =
                typeof item.price === "object"
                  ? Number(item.price.$numberInt)
                  : item.price;
              const quantity =
                typeof item.quantity === "object"
                  ? Number(item.quantity.$numberInt)
                  : item.quantity;
              const itemId = getItemId(item._id);
              if (!itemId) return null;
              return (
                <div key={itemId} style={styles.card}>
                  <img
                    src={getImageUrl(item.mainImage)}
                    alt={item.name}
                    style={styles.image}
                  />
                  <div style={styles.details}>
                    <h4 style={styles.name}>{item.name}</h4>
                    <p style={styles.price}>{price} ريال</p>
                    <div style={styles.actions}>
                      <button
                        style={styles.qtyBtn}
                        onClick={() =>
                          updateQuantity(itemId, quantity - 1)
                        }
                      >
                        <img
                          src={minusIcon}
                          alt="-"
                          style={styles.smallIcon}
                        />
                      </button>
                      <span style={styles.quantityText}>{quantity}</span>
                      <button
                        style={styles.qtyBtn}
                        onClick={() =>
                          updateQuantity(itemId, quantity + 1)
                        }
                      >
                        <img
                          src={plusIcon}
                          alt="+"
                          style={styles.smallIcon}
                        />
                      </button>
                    </div>
                  </div>
                  <img
                    src={trashIcon}
                    alt="delete"
                    style={styles.deleteIcon}
                    onClick={() => handleRemoveFromCart(itemId)}
                  />
                </div>
              );
            })
          )}
        </div>
        {cart.length > 0 && (
          <div style={styles.footer}>
            <div style={styles.total}>
              الإجمالي: <strong>{total} ريال</strong>
            </div>
            <button
              style={styles.checkoutBtn}
              onClick={() => {
                setActiveModal(null);
                navigate("/checkout");
              }}
            >
              إتمام الشراء
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
};
const FavSheet = ({ favorites, loading, screenHeight, setActiveModal, handleAddToCart, handleRemoveFavorite, getItemId, getImageUrl }) => {
  const sheetY = useMotionValue(0);
  const opacity = useTransform(sheetY, [0, screenHeight], [0.45, 0]);
  const paddingBottom = useTransform(sheetY, (y) => y);
  const controls = useDragControls();
  return (
    <>
      <motion.div
        style={{ ...styles.overlay, opacity }}
        onClick={() => setActiveModal(null)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        style={{ ...styles.sheet, maxHeight: "100vh", y: sheetY }}
        initial={{ y: screenHeight }}
        animate={{ y: 0 }}
        exit={{ y: screenHeight }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        drag="y"
        dragListener={false}
        dragControls={controls}
        dragConstraints={{ top: 0, bottom: screenHeight }}
        dragElastic={0.2}
        onDragEnd={(_, { velocity }) => {
          const currentY = sheetY.get();
          const snapPoints = [0, screenHeight * 0.5, screenHeight];
          const closest = snapPoints.reduce((prev, curr) =>
            Math.abs(curr - currentY) < Math.abs(prev - currentY) ? curr : prev
          );
          if (velocity.y > 500 || closest >= screenHeight) {
            setActiveModal(null);
          } else {
            animate(sheetY, closest, { type: "spring", stiffness: 300, damping: 30 });
          }
        }}
      >
        <div
          onPointerDown={(e) => controls.start(e)}
          style={styles.handle}
        />
        <h3 style={styles.title}>مفضلتي ({favorites.length})</h3>
        <div style={{ ...styles.scroll, paddingBottom }}>
          {loading ? (
            <motion.div
              style={styles.loadingBar}
              animate={{ x: ["100%", "-100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          ) : favorites.length === 0 ? (
            <p style={styles.emptyText}>لا توجد منتجات مفضلة</p>
          ) : (
            favorites.map((item) => {
              const price =
                typeof item.price === "object"
                  ? Number(item.price.$numberInt)
                  : item.price;
              const itemId = getItemId(item._id);
              if (!itemId) return null;
              return (
                <div key={itemId} style={styles.card}>
                  <img
                    src={getImageUrl(item.mainImage)}
                    alt={item.name}
                    style={styles.image}
                  />
                  <div style={styles.details}>
                    <h4 style={styles.name}>{item.name}</h4>
                    <p style={styles.price}>{price} ريال</p>
                  </div>
                  <div style={styles.favActions}>
                    <img
                      src={cartAddIcon}
                      alt="add to cart"
                      style={styles.smallIcon}
                      onClick={() => handleAddToCart(item)}
                    />
                    <img
                      src={trashIcon}
                      alt="delete"
                      style={styles.smallIcon}
                      onClick={() => handleRemoveFavorite(itemId)}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </>
  );
};
export default BottomNav;
const styles = {
  'badge': {
    'position': 'absolute',
    'top': '-6px',
    'right': '-6px',
    'background': '#4B0082', // ← Purple Jungle Bloom للبادج جذاب
    'color': '#FFFFFF',
    'fontSize': '10px',
    'fontWeight': 'bold',
    'width': '18px',
    'height': '18px',
    'borderRadius': '50%',
    'display': 'flex',
    'alignItems': 'center',
    'justifyContent': 'center',
  },
  'navbar': (mode) => ({
    'position': 'fixed',
    'zIndex': 1000,
    'background': 'rgba(2, 37, 26, 0.55)', // ← Deep Jungle Green شفاف
    'backdropFilter': 'blur(10px)',
    'WebkitBackdropFilter': 'blur(10px)',
    'border': '1px solid rgba(20, 80, 50, 0.25)', // حدود خضراء
    'boxShadow': '0 8px 25px rgba(2, 37, 26, 0.15)', // ظل غابي
    'borderRadius': '30px',
    'display': 'flex',
    'gap': '15px',
    ...(mode === 'vertical' ? {
      'top': '50%',
      'left': '20px',
      'transform': 'translateY(-50%)',
      'flexDirection': 'column',
      'width': '70px',
      'height': 'auto',
      'padding': '15px 0'
    } : {
      'bottom': '70px',
      'left': '50%',
      'transform': 'translateX(-50%)',
      'flexDirection': 'row',
      'justifyContent': 'space-around',
      'alignItems': 'center',
      'width': '90vw',
      'maxWidth': '420px',
      'height': '65px'
    })
  }),
  'iconBtn': {
    'background': 'transparent',
    'border': 'none',
    'cursor': 'pointer',
    'position': 'relative',
    'transition': 'transform 0.3s ease', // لتأثير hover
    ':hover': { 'transform': 'scale(1.1)' }
  },
  'icon': {
    'width': '35px',
    'height': '35px'
  },
  'bigFavIcon': {
    'width': '30px',
    'height': '30px'
  },
  'overlay': {
    'position': 'fixed',
    'inset': 0,
    'background': 'rgba(2, 37, 26, 0.45)', // ← Deep Jungle Green شفاف
    'zIndex': 1200
  },
  'sheet': {
    'position': 'fixed',
    'bottom': 0,
    'left': 0,
    'width': '100vw',
    'background': '#145032', // ← Lush Forest Green لخلفية الشيت
    'borderTopLeftRadius': '30px',
    'borderTopRightRadius': '30px',
    'boxShadow': '0 -4px 15px rgba(2, 37, 26, 0.25)', // ظل غابي
    'padding': '5px',
    'zIndex': 1300,
    'height': '60vh',
    'maxHeight': '85vh',
    'overflow': 'hidden',
    'display': 'flex',
    'flexDirection': 'column'
  },
  'scroll': {
    'flex': 1,
    'overflowY': 'auto',
    'overflowX': 'hidden',
    'paddingRight': '6px',
    'WebkitOverflowScrolling': 'touch'
  },
  'toast': {
    'position': 'fixed',
    'bottom': '90px',
    'left': '50%',
    'transform': 'translateX(-50%)',
    'background': '#A52A2A', // ← Red Fungus للتنبيهات
    'color': '#FFFFFF',
    'padding': '10px 20px',
    'borderRadius': '30px',
    'fontSize': '14px',
    'fontWeight': '600',
    'boxShadow': '0 4px 10px rgba(2, 37, 26, 0.2)', // ظل غابي
    'zIndex': 2000
  },
  'title': {
    'fontSize': '1.2rem',
    'fontWeight': '700',
    'marginBottom': '12px',
    'textAlign': 'center',
    'color': '#E1B866' // ← Sunlit Yellow للعناوين جذابة
  },
  'emptyText': {
    'textAlign': 'center',
    'color': '#E1B866', // ← Sunlit Yellow للنصوص
    'marginTop': '20px'
  },
  'card': {
    'display': 'flex',
    'alignItems': 'center',
    'gap': '10px',
    'background': '#02251A', // ← Deep Jungle Green للكارد غامق
    'borderRadius': '20px',
    'padding': '10px',
    'boxShadow': '0 2px 6px rgba(20, 80, 50, 0.08)', // ظل خفيف
    'transition': 'transform 0.3s ease',
    ':hover': { 'transform': 'scale(1.02)' } // hover لجذب
  },
  'name': {
    'fontSize': '0.9rem',
    'fontWeight': '600',
    'color': '#E1B866' // ← Sunlit Yellow للأسماء
  },
  'price': {
    'fontSize': '0.8rem',
    'fontWeight': '500',
    'color': '#FF7518' // ← Orange Mushroom للأسعار بارزة
  },
  'image': {
    'width': '60px',
    'height': '60px',
    'borderRadius': '18px',
    'objectFit': 'cover',
    'border': '1px solid #E1B866' // ← Sunlit Yellow للحدود
  },
  'details': {
    'flex': 1,
    'display': 'flex',
    'flexDirection': 'column',
    'gap': '5px'
  },
  'qtyBtn': {
    'backgroundColor': '#145032', // ← Lush Forest Green للأزرار
    'borderRadius': '50%',
    'width': '28px',
    'height': '28px',
    'display': 'flex',
    'alignItems': 'center',
    'justifyContent': 'center',
    'boxShadow': '0 2px 4px rgba(2, 37, 26, 0.1)',
    'border': 'none',
    'padding': '0',
    'cursor': 'pointer',
    'transition': 'background 0.3s ease',
    ':hover': { 'backgroundColor': '#02251A' } // hover غامق
  },
  'deleteIcon': {
    'width': '28px',
    'height': '28px',
    'cursor': 'pointer',
    'transition': 'transform 0.3s ease',
    ':hover': { 'transform': 'scale(1.2)' } // hover للحذف
  },
  'smallIcon': {
    'width': '22px',
    'height': '22px',
    'cursor': 'pointer'
  },
  'favActions': {
    'display': 'flex',
    'gap': '22px',
    'alignItems': 'center'
  },
  'footer': {
    'marginTop': '10px',
    'display': 'flex',
    'justifyContent': 'space-between',
    'alignItems': 'center',
    'borderTop': '1px solid #E1B866', // ← Sunlit Yellow للحد
    'paddingTop': '10px'
  },
  'total': {
    'fontSize': '1rem',
    'color': '#FF7518', // ← Orange Mushroom للإجمالي بارز
    'fontWeight': '600'
  },
  'checkoutBtn': {
    'background': '#FF7518', // ← Orange Mushroom لـ CTA إتمام الشراء
    'border': 'none',
    'borderRadius': '30px',
    'padding': '10px 20px',
    'fontWeight': '600',
    'color': '#FFFFFF',
    'cursor': 'pointer',
    'transition': 'background 0.3s ease',
    ':hover': { 'background': '#A52A2A' } // hover أحمر للإثارة
  },
  '@media (max-width: 430px)': {
    'sheet': { 'width': '100vw', 'height': '75vh' },
    'card': { 'padding': '8px', 'gap': '8px' },
    'image': { 'width': '55px', 'height': '55px' }
  },
  'loadingBar': {
    'height': '4px',
    'background': 'linear-gradient(to right, #E1B866, #FF7518)', // ← تدرج أصفر/برتقالي
    'position': 'absolute',
    'top': 0,
    'left': 0,
    'width': '100%'
  },
  'quantityText': {
    'color': '#E1B866', // ← Sunlit Yellow للعدد واضح ويتناسب مع الخلفية الغامقة
    'fontSize': '1rem',
    'fontWeight': '600',
    'margin': '0 10px'
  },
  'actions': {
    'display': 'flex',
    'alignItems': 'center',
    'gap': '5px'
  }
};