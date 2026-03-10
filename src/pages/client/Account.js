import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getUserById, updateUser, verifyPassword, updateUsername, updatePassword } from "../../api/api";
import "./Account.css";
import BottomNav from "../../components/BottomNav";
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

const Account = () => {
  const userId = JSON.parse(localStorage.getItem("user"))?._id;
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [editField, setEditField] = useState(null);
  const [locationDetected, setLocationDetected] = useState(false);
  const [sheetError, setSheetError] = useState("");
  const editIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770411103/edit_qr0z2r.svg";
  const closeIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770409276/close_ocjfbw.svg";
  const [editModal, setEditModal] = useState(null);
  const [step, setStep] = useState(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [coords, setCoords] = useState([24.7136, 46.6753]); // جديد: للخريطة

  // 🟢 تحميل بيانات المستخدم
  useEffect(() => {
    if (userId) loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      const res = await getUserById(userId);
      const u = res.data;
      setUser(u);
      setFormData({
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        phone: u.phone || "",
        location: u.location || "",
        latitude: u.latitude || null,
        longitude: u.longitude || null,
        address: u.address || "",
      });
      if (u.latitude && u.longitude) {
        setCoords([u.latitude, u.longitude]); // جديد: تحديث coords للخريطة
      }
    } catch (err) {
      console.error("Error loading user:", err);
    }
  };

  // 💾 حفظ البيانات العامة
 const handleSave = async () => {
  setIsSaving(true);
  try {
    const response = await updateUser(userId, formData);

    // 🔄 تحديث localStorage + الحالة + إخطار النافبار
    const updatedUser = response.data;
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setFormData({
      firstName: updatedUser.firstName || "",
      lastName: updatedUser.lastName || "",
      phone: updatedUser.phone || "",
      location: updatedUser.location || "",
      latitude: updatedUser.latitude || null,
      longitude: updatedUser.longitude || null,
      address: updatedUser.address || "",
    });

    window.dispatchEvent(new Event("authChange"));

    alert("✅ تم حفظ البيانات بنجاح");
    setEditField(null);
    setLocationDetected(false);
  } catch (err) {
    alert(err.response?.data?.message || "حدث خطأ أثناء حفظ البيانات");
  } finally {
    setIsSaving(false);
  }
};

  // 📍 تحديد الموقع الذكي تلقائيًا
  const detectLocation = () => {
    if (!navigator.geolocation) return alert("المتصفح لا يدعم تحديد الموقع");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
          );
          const geoData = await geoRes.json();
          const { city, town, village, suburb, neighbourhood, road } = geoData.address || {};
          const address = [city || town || village, suburb || neighbourhood, road]
            .filter(Boolean)
            .join("، ");
          setFormData((prev) => ({
            ...prev,
            latitude,
            longitude,
            location: url,
            address: address || "لم يتم العثور على عنوان دقيق",
          }));
          setCoords([latitude, longitude]); // جديد: تحديث الخريطة فوراً
          setLocationDetected(true);
        } catch (err) {
          console.error("خطأ في جلب العنوان:", err);
          setFormData((prev) => ({
            ...prev,
            latitude,
            longitude,
            location: url,
          }));
          setCoords([latitude, longitude]); // جديد: تحديث الخريطة
          setLocationDetected(true);
        }
      },
      (err) => alert("تعذر تحديد الموقع: " + err.message)
    );
  };

  // 🔒 النوافذ المنبثقة
  const resetModal = () => {
    setEditModal(null);
    setStep(1);
    setCurrentPassword("");
    setNewUsername("");
    setCurrentUsername("");
    setNewPassword("");
    setSheetError("");
    setIsVerifying(false);
    setIsUpdating(false);
  };

  const handleVerifyPassword = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyPassword({ userId, password: currentPassword });
      if (res.data.success) {
        setSheetError("");
        setStep(2);
      }
    } catch {
      setSheetError("كلمة المرور غير صحيحة");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpdateUsername = async () => {
    setIsUpdating(true);
    try {
      const res = await updateUsername({ userId, password: currentPassword, newUsername });
      if (res.data.success) {
        alert(res.data.message);
        await loadUser();
        resetModal();
      }
    } catch {
      alert("حدث خطأ أثناء تحديث الاسم");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVerifyUsername = () => {
    setIsVerifying(true);
    if (currentUsername === user.username) {
      setSheetError("");
      setStep(2);
    } else {
      setSheetError("اسم المستخدم غير صحيح");
    }
    setIsVerifying(false);
  };

  const handleUpdatePassword = async () => {
    setIsUpdating(true);
    try {
      const res = await updatePassword({ username: currentUsername, newPassword });
      if (res.data.success) {
        alert(res.data.message);
        resetModal();
      }
    } catch {
      alert("حدث خطأ أثناء تحديث كلمة المرور");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="account-container">
        <motion.div
          className="account-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="account-title">حسابي</h2>
          {/* الاسم */}
          <div className="info-row">
            <div className="info-label">الاسم</div>
            {editField === "name" ? (
              <>
                <input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="الاسم الأول"
                />
                <input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="الاسم الأخير"
                />
              </>
            ) : (
              <div className="info-value">{`${formData.firstName} ${formData.lastName}`}</div>
            )}
            <img
              src={editIcon}
              alt="edit"
              className="edit-icon"
              onClick={() => setEditField(editField === "name" ? null : "name")}
            />
          </div>
          {/* رقم الجوال */}
          <div className="info-row">
            <div className="info-label">رقم الجوال</div>
            {editField === "phone" ? (
              <input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="رقم الجوال"
              />
            ) : (
              <div className="info-value">{formData.phone}</div>
            )}
            <img
              src={editIcon}
              alt="edit"
              className="edit-icon"
              onClick={() => setEditField(editField === "phone" ? null : "phone")}
            />
          </div>
          {/* الموقع */}
          <div className="map-section">
            <div className="map-header">
              <span>الموقع</span>
              <img
                src={editIcon}
                alt="edit"
                className="edit-icon"
                onClick={() => setEditField(editField === "location" ? null : "location")}
              />
            </div>
            {/* عرض الخريطة المحفوظة دائمًا */}
            {formData.latitude && formData.longitude && (
              <MapContainer center={coords} zoom={13} scrollWheelZoom={false} style={{ height: 200, marginBottom: 12 }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={coords}>
                  <Popup>موقعك المحدد</Popup>
                </Marker>
              </MapContainer>
            )}
            {/* تعديل الموقع فقط عند النقر على التعديل */}
            {editField === "location" && (
              <>
                <input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="ضع رابط الموقع أو حدده تلقائيًا"
                />
                <button className="btn-locate" onClick={detectLocation}>
                  موقعي الحالي
                </button>
                {formData.address && (
                  <div className="address-preview">
                    <strong> العنوان المكتشف:</strong> {formData.address}
                  </div>
                )}
                {locationDetected && formData.latitude && formData.longitude && (
                  <MapContainer center={coords} zoom={13} scrollWheelZoom={false} style={{ height: 200, marginBottom: 12 }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <DraggableMarker position={coords} setCoords={setCoords} setFormLocation={(loc) => setFormData({ ...formData, location: loc })} />
                  </MapContainer>
                )}
              </>
            )}
          </div>
          {/* حفظ */}
          <button className="btn-save" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "جاري الحفظ" : "حفظ التعديلات"}
          </button>
          {/* إعدادات */}
          <div className="account-actions">
            <button className="username-btn" onClick={() => setEditModal("username")}>
              تغيير اسم المستخدم
            </button>
            <button className="password-btn" onClick={() => setEditModal("password")}>
              تعديل كلمة المرور
            </button>
          </div>
        </motion.div>
      </div>
      <BottomNav />
      {/* النوافذ المنبثقة */}
      <AnimatePresence>
        {editModal === "username" && (
          <motion.div className="overlay" onClick={resetModal}>
            <motion.div
              className="bottom-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={closeIcon} alt="close" className="close-icon" onClick={resetModal} />
              <h3>تحديث اسم المستخدم</h3>
              {sheetError && <div className="sheet-alert">{sheetError}</div>}
              {step === 1 ? (
                <>
                  <input
                    type="password"
                    placeholder="كلمة المرور الحالية"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button onClick={handleVerifyPassword} disabled={isVerifying}>
                    {isVerifying ? "جاري التحقق" : "تحقق"}
                  </button>
                </>
              ) : (
                <>
                  <input
                    placeholder="اسم المستخدم الجديد"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                  <button onClick={handleUpdateUsername} disabled={isUpdating}>
                    {isUpdating ? "جاري التحديث" : "تحديث"}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editModal === "password" && (
          <motion.div className="overlay" onClick={resetModal}>
            <motion.div
              className="bottom-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={closeIcon} alt="close" className="close-icon" onClick={resetModal} />
              <h3>تحديث كلمة المرور</h3>
              {sheetError && <div className="sheet-alert">{sheetError}</div>}
              {step === 1 ? (
                <>
                  <input
                    placeholder="اسم المستخدم"
                    value={currentUsername}
                    onChange={(e) => setCurrentUsername(e.target.value)}
                  />
                  <button onClick={handleVerifyUsername} disabled={isVerifying}>
                    {isVerifying ? "جاري التحقق" : "تحقق"}
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="password"
                    placeholder="كلمة المرور الجديدة"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button onClick={handleUpdatePassword} disabled={isUpdating}>
                    {isUpdating ? "جاري التحديث" : "تحديث"}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Account;