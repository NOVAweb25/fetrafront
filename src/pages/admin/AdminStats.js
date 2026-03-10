import React, { useEffect, useState } from "react";
import { getStats, getReviews } from "../../api/api";
import { colors, fonts, fontSizes } from "../../utils/theme";
import { motion } from "framer-motion";
import AdminSidebar from "../../components/AdminSidebar";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AdminStats = () => {
  const [stats, setStats] = useState({
    users: 0,
    deliveredOrders: 0,
    confirmedBookings: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    ordersGrowth: [],
    productsWithInterest: [],
  });
  const [reviews, setReviews] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const fetchStats = async () => {
    const res = await getStats();
    setStats(res.data);
  };
  const dashboardIcon =
    "https://res.cloudinary.com/dp1bxbice/image/upload/v1770406947/dashboard_v8coub.svg";
  const fetchReviews = async () => {
    const res = await getReviews();
    setReviews(res.data);
  };
  useEffect(() => {
    fetchStats();
    fetchReviews();
  }, []);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const orderData = [
    { name: "تم التسليم", value: stats.deliveredPercentage },
    { name: "تم الإلغاء", value: stats.cancelledPercentage },
  ];
  const pieColors = ["#145032", "#A52A2A"]; // Updated to palette: green for delivered, red for cancelled
  const interestedProducts =
    stats.productsWithInterest?.filter((p) => p.interestedCount > 0) || [];
  return (
    <>
      <AdminSidebar />
      <div style={{ background: "#FFFFFF", minHeight: "100vh" }}>
        <div style={styles.container(isMobile)}>
          <div style={styles.headerIconContainer}>
            <img
              src={dashboardIcon}
              alt="Dashboard"
              style={styles.headerIcon(isMobile)}
            />
          </div>
          <div style={styles.statsContainer}>
            <motion.div
              style={{ ...styles.statCard(isMobile), background: "#145032" }} // Lush Forest Green
              whileHover={{ scale: 1.05 }}
            >
              <h3 style={styles.statValue(isMobile)}>{stats.users}</h3>
              <p style={styles.statLabel(isMobile)}>عدد المستخدمين</p>
            </motion.div>
            <motion.div
              style={{ ...styles.statCard(isMobile), background: "#E1B866" }} // Sunlit Yellow
              whileHover={{ scale: 1.05 }}
            >
              <h3 style={styles.statValue(isMobile)}>{stats.deliveredOrders}</h3>
              <p style={styles.statLabel(isMobile)}>الطلبات المنفذة</p>
            </motion.div>
            <motion.div
              style={{ ...styles.statCard(isMobile), background: "#FF7518" }} // Orange Mushroom
              whileHover={{ scale: 1.05 }}
            >
              <h3 style={styles.statValue(isMobile)}>{stats.confirmedBookings}</h3>
              <p style={styles.statLabel(isMobile)}>الحجوزات المؤكدة</p>
            </motion.div>
          </div>
          <div style={styles.chartsContainer(isMobile)}>
            <div style={styles.chartBox(isMobile)}>
              <h3 style={styles.chartTitle(isMobile)}> نمو الطلبات</h3>
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                <LineChart data={stats.ordersGrowth}>
                  <CartesianGrid
                    stroke="#4B0082"
                    strokeDasharray="3 3"
                  />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#E1B866"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={styles.chartBox(isMobile)}>
              <h3 style={styles.chartTitle(isMobile)}> حالة الطلبات</h3>
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                <PieChart>
                  <Pie
                    data={orderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 60 : 80}
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {orderData.map((entry, index) => (
                      <Cell key={index} fill={pieColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <h2 style={{ ...styles.title(isMobile), marginTop: "40px" }}>
            المنتجات المرغوبة
          </h2>
          <div style={styles.interestedProductsContainer}>
            {interestedProducts.length > 0 ? (
              interestedProducts.map((p, index) => (
                <motion.div
                  key={index}
                  style={styles.interestedProductCard(isMobile)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <span style={styles.interestedProductName(isMobile)}>{p.name}</span>
                  <div style={styles.interestedCountCircle(isMobile)}>
                    {p.interestedCount}
                  </div>
                </motion.div>
              ))
            ) : (
              <p style={styles.noInterested(isMobile)}>لا توجد منتجات مرغوبة بعد</p>
            )}
          </div>
          <h2 style={{ ...styles.title(isMobile), marginTop: "40px" }}>آراء العملاء</h2>
          <div style={styles.reviewsContainer(isMobile)}>
            {reviews.length > 0 ? (
              reviews.map((r, index) => (
                <motion.div
                  key={r._id || index}
                  style={styles.reviewCard(isMobile)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <h4 style={styles.reviewUser(isMobile)}>{r.userName}</h4>
                  <p style={styles.reviewContent(isMobile)}>{r.content}</p>
                  <div style={styles.reviewRatingContainer}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        style={{
                          ...styles.star(isMobile),
                          ...(i < r.rating ? styles.starActive : {}),
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              <p style={styles.noReviews(isMobile)}>لا توجد آراء بعد</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default AdminStats;
const styles = {
  container: (isMobile) => ({
    flex: 1,
    background: "rgba(2, 37, 26, 0.05)", // Light Deep Jungle Green for subtle background
    padding: isMobile ? "10px" : "20px",
    fontFamily: fonts.primary,
    maxWidth: isMobile ? "100%" : "1200px",
    margin: "0 auto",
  }),
  reviewRatingContainer: {
    display: "flex",
    gap: "4px",
    marginTop: "8px",
  },
  star: (isMobile) => ({
    fontSize: isMobile ? "16px" : "20px",
    color: "#145032", // Lush Forest Green for inactive stars
  }),
  starActive: {
    background: "linear-gradient(45deg, #FF7518, #E1B866)", // Orange to Yellow gradient
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontWeight: "bold",
    transform: "scale(1.1)",
  },
  title: (isMobile) => ({
    fontFamily: fonts.secondary,
    color: "#4B0082", // Purple for titles
    fontSize: isMobile ? "20px" : "24px",
    marginBottom: isMobile ? "15px" : "20px",
    textAlign: "center",
    fontWeight: "600",
  }),
  statsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "center",
    marginBottom: "30px",
  },
  statCard: (isMobile) => ({
    width: isMobile ? "100px" : "140px",
    height: isMobile ? "100px" : "140px",
    borderRadius: "50%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#FFFFFF", // White text for contrast
    boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
    transition: "transform 0.3s ease",
  }),
  statValue: (isMobile) => ({
    fontSize: isMobile ? "20px" : "24px",
    fontWeight: "bold",
  }),
  statLabel: (isMobile) => ({
    fontSize: isMobile ? "12px" : "14px",
    marginTop: "6px",
    textAlign: "center",
  }),
  chartsContainer: (isMobile) => ({
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "30px",
    justifyContent: "space-between",
  }),
  chartBox: (isMobile) => ({
    flex: 1,
    minWidth: isMobile ? "100%" : "300px",
    background: "#FFFFFF",
    borderRadius: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    padding: isMobile ? "10px" : "15px",
    border: "1px solid rgba(20, 80, 50, 0.1)", // Light green border
  }),
  chartTitle: (isMobile) => ({
    fontSize: isMobile ? "16px" : "18px",
    marginBottom: "12px",
    color: "#4B0082", // Purple for chart titles
    textAlign: "center",
    fontWeight: "500",
  }),
  reviewsContainer: (isMobile) => ({
    marginTop: "20px",
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "15px",
  }),
  reviewCard: (isMobile) => ({
    background: "#FFFFFF",
    padding: isMobile ? "10px 15px" : "15px 20px",
    borderRadius: "20px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    transition: "transform 0.3s ease",
  }),
  reviewUser: (isMobile) => ({
    margin: 0,
    fontWeight: "bold",
    color: "#145032", // Green for user names
    fontSize: isMobile ? "14px" : "16px",
  }),
  reviewContent: (isMobile) => ({
    margin: "8px 0",
    fontSize: "14px",
    lineHeight: "1.5",
    color: "#02251A", // Dark green for content
  }),
  headerIconContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "25px",
  },
  headerIcon: (isMobile) => ({
    width: isMobile ? "70px" : "90px",
    height: isMobile ? "70px" : "90px",
  }),
  noReviews: (isMobile) => ({
    textAlign: "center",
    color: "#145032",
    fontSize: isMobile ? "14px" : "16px",
    opacity: 0.7,
  }),
  // ✅ أنماط جديدة لقسم المنتجات المرغوبة
  interestedProductsContainer: {
    display: "flex",
    overflowX: "auto",
    gap: "15px",
    padding: "10px 0",
    marginBottom: "20px",
    scrollbarWidth: "thin",
    scrollbarColor: "#FF7518 rgba(2, 37, 26, 0.1)",
  },
  interestedProductCard: (isMobile) => ({
    background: "#FFFFFF",
    borderRadius: "15px",
    padding: isMobile ? "8px 12px" : "12px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: isMobile ? "140px" : "180px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "transform 0.3s ease",
  }),
  interestedProductName: (isMobile) => ({
    fontSize: isMobile ? "13px" : "15px",
    fontWeight: "600",
    color: "#02251A", // Dark green for names
    flex: 1,
  }),
  interestedCountCircle: (isMobile) => ({
    background: "#FF7518", // Orange for count
    color: "#FFFFFF",
    borderRadius: "50%",
    width: isMobile ? "28px" : "35px",
    height: isMobile ? "28px" : "35px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: isMobile ? "13px" : "15px",
    fontWeight: "bold",
    marginLeft: "12px",
    boxShadow: "0 3px 8px rgba(255, 117, 24, 0.3)", // Orange shadow
  }),
  noInterested: (isMobile) => ({
    textAlign: "center",
    color: "#145032",
    fontSize: isMobile ? "14px" : "16px",
    opacity: 0.7,
    width: "100%",
  }),
};