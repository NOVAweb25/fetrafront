import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { registerUser } from "../api/api";
import { colors, fonts, fontSizes, buttonSizes } from "../utils/theme";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// إصلاح أيقونة Marker الافتراضية
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// مكون DraggableMarker (تم تصحيح التكرار وإضافة فتح Google Maps)
const DraggableMarker = ({ position, setCoords, setFormLocation }) => {
  const markerRef = React.useRef(null);
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setCoords([lat, lng]);
      setFormLocation(`${lat},${lng}`);
    },
  });
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const { lat, lng } = marker.getLatLng();
        setCoords([lat, lng]);
        setFormLocation(`${lat},${lng}`);
      }
    },
  };
  const openInGoogleMaps = () => {
    const [lat, lng] = position;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };
  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    >
      <Popup>
        <div style={{ cursor: "pointer" }} onClick={openInGoogleMaps}>
          عرض الموقع في Google Maps
        </div>
      </Popup>
    </Marker>
  );
};

const Register = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    location: "",
    password: "",
  });
  const [coords, setCoords] = useState([24.7136, 46.6753]);
  const [locationAddress, setLocationAddress] = useState(""); // جديد: لحفظ العنوان
  const [alertMessage, setAlertMessage] = useState("");
  const navigate = useNavigate();
  const [hoverBack, setHoverBack] = useState(false);
  const backIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770406972/home_jgi9rf.svg"; // تصحيح الـ quotes
  const backgroundVideo = "https://res.cloudinary.com/dp1bxbice/video/upload/v1770408547/login_lp7jjm.mp4"; // نقل داخل الـ component لو لزم

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const setFormLocation = (loc) =>
    setForm((prev) => ({ ...prev, location: loc }));

  // ✅ تنبيه علوي
  const showAlert = (msg) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(""), 2500);
  };

  // ✅ جلب العنوان من coordinates باستخدام Nominatim API
  const getAddress = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await response.json();
      setLocationAddress(data.display_name || "العنوان غير متوفر");
    } catch (err) {
      console.error("Failed to fetch address:", err);
      setLocationAddress("تعذر جلب العنوان");
    }
  };

  // ✅ الحصول على الموقع الحالي تلقائيًا + جلب العنوان
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords([latitude, longitude]);
          setFormLocation(`${latitude},${longitude}`);
          getAddress(latitude, longitude); // جديد: جلب العنوان للتأكيد
          showAlert("📍 تم تحديد موقعك بنجاح");
        },
        () => showAlert("⚠️ لم نستطع الحصول على موقعك الحالي")
      );
    } else {
      showAlert("❌ المتصفح لا يدعم تحديد الموقع");
    }
  };

  // ✅ عند تغيير coords (بالسحب أو الكليك)، جلب العنوان تلقائياً
  useEffect(() => {
    if (coords[0] !== 24.7136 || coords[1] !== 46.6753) { // تجنب الافتراضي
      getAddress(coords[0], coords[1]);
    }
  }, [coords]);

  // ✅ التحقق من الحقول قبل التسجيل
  const validateForm = () => {
    for (let key in form) {
      if (!form[key].trim()) {
        const el = document.querySelector(`[name="${key}"]`);
        if (el) el.focus();
        showAlert("⚠️ يرجى تعبئة جميع الخانات");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const res = await registerUser(form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      // إشعار باقي المكونات بأن مستخدم جديد تم تسجيله
      window.dispatchEvent(new Event("authChange"));
      navigate("/");
    } catch (err) {
      if (err.response) {
        const message = err.response.data?.message || "";
        // ✅ مطابقة رسائل الكنترول
        if (message.includes("رقم الجوال")) {
          showAlert("⚠️ رقم الجوال مستخدم مسبقًا، لا يمكن إنشاء حساب جديد");
        } else if (message.includes("اسم المستخدم")) {
          showAlert("⚠️ اسم المستخدم مستخدم مسبقًا، اختر اسمًا آخر");
        } else {
          showAlert("❌ حدث خطأ أثناء التسجيل، حاول مرة أخرى");
        }
      } else {
        showAlert("❌ لا يمكن الاتصال بالخادم الآن");
      }
    }
  };

  const handleMapClick = () => {
    const [lat, lng] = coords;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  return (
    <div style={styles.container}>
      <video autoPlay loop muted playsInline style={styles.video}>
        <source src={backgroundVideo} type="video/mp4" />
      </video>
      {/* 🔔 تنبيه علوي */}
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
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        style={styles.card}
      >
        <Link
          to="/"
          style={{
            ...styles.back,
            backgroundColor: hoverBack ? "#02251A" : "#145032", // ← Lush Forest Green أساسي، hover غامق
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
        <h2 style={styles.title}>تسجيل جديد</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <input
              type="text"
              name="firstName"
              placeholder="الاسم الأول"
              value={form.firstName}
              onChange={handleChange}
              style={styles.input}
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="الاسم الأخير"
              value={form.lastName}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          <input
            type="text"
            name="phone"
            placeholder="رقم الجوال"
            value={form.phone}
            onChange={handleChange}
            style={styles.input}
            required
          />
          <button type="button" onClick={handleGetLocation} style={{ ...styles.button, marginBottom: "8px" }}>
            تحديد موقعي الحالي
          </button>
          {/* ✅ الخريطة تظهر الموقع المحدد وتفتح خرائط Google عند الضغط */}
          <div onClick={handleMapClick} style={{ cursor: "pointer" }}>
            <MapContainer center={coords} zoom={13} scrollWheelZoom={false} style={{ height: 200, marginBottom: 12 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <DraggableMarker position={coords} setCoords={setCoords} setFormLocation={setFormLocation} />
            </MapContainer>
          </div>
          {/* جديد: عرض العنوان للتأكيد */}
          {locationAddress && (
            <p style={styles.addressText}>
              العنوان المحدد: {locationAddress}
            </p>
          )}
          <input
            type="text"
            name="username"
            placeholder="اسم المستخدم"
            value={form.username}
            onChange={handleChange}
            style={styles.input}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="كلمة المرور"
            value={form.password}
            onChange={handleChange}
            style={styles.input}
            required
          />
          <motion.button
            type="submit"
            style={styles.button}
            whileHover={{ scale: 1.05, backgroundColor: '#A52A2A' }} // hover أحمر
            whileTap={{ scale: 0.95 }}
          >
            تسجيل
          </motion.button>
        </form>
        <div style={styles.registerText}>
          لديك حساب؟{" "}
          <Link to="/login" style={styles.registerLink}>
            سجل دخولك
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
export default Register;
// 🎨 الأنماط المعدلة لتكون responsive وتسمح بالسكرول (تصحيح الاختفاء + الشاشات المختلفة)
const styles = {
  container: {
    position: "relative",
    width: "100%",
    minHeight: "100vh", // تغيير height إلى minHeight عشان يسمح بالسكرول لو المحتوى أكبر
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: fonts.primary,
    overflow: "visible", // إزالة hidden عشان يسمح بالسكرول الطبيعي للصفحة
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
  card: {
    background: "rgba(20, 80, 50, 0.22)", // ← Lush Forest Green #145032 مع شفافية زجاجية
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    padding: "30px 20px",
    borderRadius: "16px",
    textAlign: "center",
    width: "100%", // تغيير: 100% على الشاشات الصغيرة
    maxWidth: "340px", // الحد الأقصى للشاشات الكبيرة
    boxShadow: "0 8px 24px rgba(2, 37, 26, 0.35)", // ظل غامق غابي
    position: "relative",
    zIndex: 1,
    border: "1px solid rgba(20, 80, 50, 0.35)", // حدود خضراء خفيفة
    overflow: "visible", // تأكيد عدم اختفاء أجزاء
  },
  title: {
    fontFamily: fonts.secondary,
    color: "#E1B866", // ← Sunlit Yellow للعنوان جذاب
    fontSize: fontSizes.title,
    marginBottom: "20px",
  },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  row: { display: "flex", gap: "10px", flexWrap: "wrap" },
  input: {
    flex: 1,
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
    ':hover': { backgroundColor: "#A52A2A" } // hover أحمر
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
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: "14px",
    backgroundColor: "#145032", // ← Lush Forest Green أساسي
    transition: "all 0.3s ease",
    zIndex: 2, // تأكيد أنه فوق كل حاجة
  },
  backIcon: {
    width: "20px",
    height: "20px",
    transition: "transform 0.3s, filter 0.3s",
  },
  addressText: { // جديد: نمط لعرض العنوان
    fontSize: fontSizes.content,
    color: "#E1B866", // ← Sunlit Yellow للعنوان جذاب
    marginTop: "10px",
    textAlign: "center",
  },
};