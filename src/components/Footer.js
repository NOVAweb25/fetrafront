import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
// ⭐ استيراد الأيقونات من assets
const Footer = () => {
const tiktokIcon = "https://res.cloudinary.com/dp1bxbice/image/upload/v1770411203/tiktok_hqxvul.svg";
const emailIcon= "https://res.cloudinary.com/dp1bxbice/image/upload/v1770411104/email_moubhm.svg";
const instaIcon= "https://res.cloudinary.com/dp1bxbice/image/upload/v1770411134/instagram_iyppcd.svg";
const logo= "https://res.cloudinary.com/dp1bxbice/image/upload/v1773124728/Gemini_Generated_Image_hupcf4hupcf4hupc_yndhdc.png";
  // دالة للتمرير إلى الأعلى عند التنقل
  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };
  return (
    <footer className="footer-container">
      {/* ─────── 📌 القسم الأول: نبذة عنا ─────── */}
      <div className="footer-about-section">
        <div className="footer-logo-circle">
          <img src={logo} alt="الشعار" className="footer-logo" />
        </div>
        <h3 className="footer-title about-title">نبذة عنا</h3>
        <p className="footer-about">
          فطرة تعكس رؤيتي الداخلية للعالم، مستوحاة من سحر الطبيعة والغابات العميقة، خاصة الفطر السحري الذي يرمز إلى الغموض والاكتشاف. كفنانة، أصمم أعمالي اليدوية بالكروشيه باستخدام خيوط قطنية طبيعية، لتعبر عن تقديري للطبيعة ومبادئي البيئية. كل قطعة فريدة، غير مكررة بكميات كبيرة، بل هي فكرة خاصة توصل شعورًا مميزًا وتجربة ساحرة.
 أعمالي ليست مجرد منتجات، بل قطع فنية تعكس ألوان الطبيعة وأشكالها، لتدخل سحر الغابة إلى حياتك اليومية.
        </p>
      </div>
      {/* ─────── 📌 القسم الثاني: تابعنا + روابط ─────── */}
      <div className="footer-top">
        {/* ⭐ يسار: تابعنا على */}
        <div className="footer-section social-links">
          <h4 className="footer-title">تابعنا على</h4>
          <div className="social-icons-row">
            {/* تيك توك */}
            <div
              className="social-icon-circle"
              onClick={() => window.open("https://www.tiktok.com/@_primitiveness_?_r=1&_d=e9ikldmeke643g&sec_uid=MS4wLjABAAAAlcfMBc0UQy1Na1v34QNMUozmGUQF70WWv08jarzk7fBta3WPvYRsuDQ-Tv59YU0d&share_author_id=7074194395477820417&sharer_language=ar&source=h5_m&u_code=e0ickkd72jcikg&ug_btm=b8727,b0&social_share_type=4&utm_source=copy&sec_user_id=MS4wLjABAAAAlcfMBc0UQy1Na1v34QNMUozmGUQF70WWv08jarzk7fBta3WPvYRsuDQ-Tv59YU0d&tt_from=copy&utm_medium=ios&utm_campaign=client_share&enable_checksum=1&user_id=7074194395477820417&share_link_id=2BF10271-1945-45D0-8535-D0FA38834354&share_app_id=1233", "_blank")}
            >
              <img src={tiktokIcon} alt="TikTok" />
            </div>
            {/* انستغرام */}
            <div
              className="social-icon-circle"
              onClick={() => window.open("https://www.instagram.com/_primitiveness_?igsh=YmVtNmczdmsybXN3&utm_source=qr", "_blank")}
            >
              <img src={instaIcon} alt="Instagram" />
            </div>
          </div>
        </div>
        {/* ⭐ يمين: روابط تهمك */}
        <div className="footer-section important-links">
          <h4 className="footer-title">روابط تهمك</h4>
          <ul>
            <li><Link to="/privacy-policy" onClick={scrollToTop}>سياسة الخصوصية</Link></li>
            <li><Link to="/terms" onClick={scrollToTop}>الشروط والأحكام</Link></li>
            <li><Link to="/payment-policy" onClick={scrollToTop}>سياسة الدفع</Link></li>
            <li><Link to="/return-policy" onClick={scrollToTop}>سياسة الاسترجاع والاستبدال</Link></li>
            <li><Link to="/order-policy" onClick={scrollToTop}>سياسة الطلب</Link></li>
          </ul>
        </div>
      </div>
      {/* ─────── 📌 القسم الثالث: تواصل معنا ─────── */}
      <div className="footer-contact">
        <h4 className="footer-title">تواصل معنا</h4>
        <div
          className="contact-row"
          onClick={() => window.location.href = "mailto:FETRA7@hotmail.com"}
        >
          <div className="contact-icon-circle">
            <img src={emailIcon} alt="Email" />
          </div>
          <span className="contact-email">FETRA7@hotmail.com</span>
        </div>
      </div>
    </footer>
  );
};
export default Footer;