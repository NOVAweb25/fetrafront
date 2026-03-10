import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createSection,
  getSections,
  updateSection,
  deleteSection,
} from "../../api/api";
import "./AdminSections.css";
import AdminSidebar from "../../components/AdminSidebar";
import PlusIcon from "../../assets/plus.svg";

const API_BASE = process.env.REACT_APP_API_BASE; // ✅ من env

const AdminSections = () => {
  const [sections, setSections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    mainImage: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const modalRef = useRef(null);
  const SearchIcon =
    "https://res.cloudinary.com/dp1bxbice/image/upload/v1770407020/search_wvv596.svg";
  const ImageIcon =
    "https://res.cloudinary.com/dp1bxbice/image/upload/v1770406971/image_ckumcg.svg";
  const EditIcon =
    "https://res.cloudinary.com/dp1bxbice/image/upload/v1770411103/edit_qr0z2r.svg";
  const DeleteIcon =
    "https://res.cloudinary.com/dp1bxbice/image/upload/v1770411122/delete_wfmwpp.svg";
  const CloseIcon =
    "https://res.cloudinary.com/dp1bxbice/image/upload/v1770409276/close_ocjfbw.svg";

  // 🟢 جلب الأقسام عند الفتح
  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const res = await getSections();
      const data = res?.data || [];
      // ✅ تعديل روابط الصور: Cloudinary أو API_BASE
      const processed = data.map((sec) => ({
        ...sec,
        mainImage: sec.mainImage
          ? sec.mainImage.startsWith("http")
            ? sec.mainImage
            : `${API_BASE}${sec.mainImage}`
          : null,
      }));
      setSections(processed);
    } catch (err) {
      console.error("Error fetching sections:", err);
    }
  };

  // 🧹 إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({ name: "", description: "", mainImage: null });
    setIsUploading(false);
  };

  // ❌ إغلاق المودال
  const closeModal = () => {
    setShowModal(false);
    setSelectedSection(null);
    resetForm();
  };

  // 🔄 حفظ أو تعديل قسم
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("اسم القسم مطلوب!");
    setIsUploading(true);
    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("description", formData.description || "");
      if (formData.mainImage instanceof File) {
        payload.append("mainImage", formData.mainImage);
      }
      let saved;
      if (selectedSection) {
        saved = await updateSection(selectedSection._id, payload);
      } else {
        saved = await createSection(payload);
      }
      const updated = {
        ...saved.data,
        mainImage: saved.data.mainImage
          ? saved.data.mainImage.startsWith("http")
            ? saved.data.mainImage
            : `${API_BASE}${saved.data.mainImage}`
          : null,
      };
      setSections((prev) =>
        selectedSection
          ? prev.map((s) => (s._id === selectedSection._id ? updated : s))
          : [updated, ...prev]
      );
      closeModal();
    } catch (err) {
      console.error("Save error:", err);
      alert(`خطأ: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 🖼️ تحميل الصورة
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("يرجى اختيار صورة فقط!");
    if (file.size > 5 * 1024 * 1024)
      return alert("حجم الصورة كبير جدًا (أقصى 5MB)!");
    setFormData({ ...formData, mainImage: file });
  };

  // ✏️ عند التعديل
  const handleEdit = (section) => {
    setSelectedSection(section);
    setFormData({
      name: section.name || "",
      description: section.description || "",
      mainImage: null,
    });
    setShowModal(true);
  };

  // 🗑️ الحذف
  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      await deleteSection(id);
      setSections((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("حدث خطأ أثناء الحذف!");
    }
  };

  // 🔍 فلترة البحث
  const filteredSections = sections.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 📸 المعاينة
  const previewImage =
    formData.mainImage instanceof File
      ? URL.createObjectURL(formData.mainImage)
      : selectedSection?.mainImage;

  // 🔗 تحديد مصدر الصورة
  const getImageSrc = (src) =>
    src
      ? src.startsWith("http") || src.startsWith("blob:")
        ? src
        : `${API_BASE}${src}`
      : ImageIcon;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-sections-container">
        {/* 🔍 شريط البحث */}
        <div className="search-container">
          <input
            type="text"
            placeholder="ابحث عن قسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <img src={SearchIcon} alt="بحث" className="search-icon" />
        </div>
        {/* ➕ زر الإضافة */}
        <motion.button
          className="add-btn"
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setShowModal(true);
            setSelectedSection(null);
            resetForm();
          }}
        >
          <img src={PlusIcon} alt="إضافة" />
        </motion.button>
        {/* 📋 قائمة الأقسام */}
        <div className="sections-list">
          {filteredSections.length > 0 ? (
            filteredSections.map((section) => (
              <motion.div
                key={section._id}
                className="section-card horizontal"
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="section-image">
                  <img
                    src={getImageSrc(section.mainImage)}
                    alt={section.name}
                    onError={(e) => (e.target.src = ImageIcon)}
                  />
                </div>
                <div className="section-name">
                  <h3>{section.name}</h3>
                </div>
                <div className="section-actions">
                  <motion.button
                    className="edit-btn"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEdit(section)}
                  >
                    <img src={EditIcon} alt="تعديل" />
                  </motion.button>
                  <motion.button
                    className="delete-btn"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(section._id)}
                  >
                    <img src={DeleteIcon} alt="حذف" />
                  </motion.button>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="no-sections">لا توجد أقسام</p>
          )}
        </div>
        {/* 🪟 مودال الإضافة / التعديل */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal} // ← إغلاق عند النقر خارج المودال
            >
              <motion.div
                ref={modalRef}
                className="modal"
                onClick={(e) => e.stopPropagation()} // ← يمنع الإغلاق عند النقر داخل المودال
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <button className="close-btn" onClick={closeModal}>
                  <img src={CloseIcon} alt="إغلاق" />
                </button>
                <h2>{selectedSection ? "تعديل القسم" : "إضافة قسم جديد"}</h2>
                <form onSubmit={handleSubmit}>
                  <label className="image-picker">
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <div className="image-circle">
                      {previewImage ? (
                        <img
                          src={getImageSrc(previewImage)}
                          alt="معاينة"
                          onError={(e) => (e.target.src = ImageIcon)}
                        />
                      ) : (
                        <img src={ImageIcon} alt="رفع صورة" />
                      )}
                    </div>
                    <span>صورة القسم</span>
                  </label>
                  <input
                    type="text"
                    placeholder="اسم القسم"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                  <textarea
                    placeholder="الوصف (اختياري)"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                  />
                  <button
                    type="submit"
                    className="save-btn"
                    disabled={isUploading}
                  >
                    {isUploading ? "جاري الحفظ..." : "حفظ"}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default AdminSections;