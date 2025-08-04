// src/pages/WarrantyTracker.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  MapPin,
  Package,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import * as XLSX from "xlsx";
import {
  setWarrantyCalculatedData,
  setWarrantyPaymentData,
  updateWarrantyPaymentStatus,
  setFilters,
} from "../store/slice/warrantyDataSlice";

const WarrantyTracker = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get data from Redux global state
  const uploadedFile = useSelector((state) => state.amcSchedule.uploadedFile);
  const warrantyData = useSelector(
    (state) => state.warranty?.calculatedData ?? null
  );

  const warrantyFilters = useSelector((state) => state.warranty.filters);

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Redirect if no file uploaded
  useEffect(() => {
    if (!uploadedFile) {
      navigate("/");
      return;
    }
  }, [uploadedFile, navigate]);

  // Initialize responsive behavior and real-time clock
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };

    handleResize();
    updateTime();

    window.addEventListener("resize", handleResize);
    const timeInterval = setInterval(updateTime, 1000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(timeInterval);
    };
  }, []);

  // Calculate warranty schedules from uploaded file
  const calculateWarrantySchedules = useCallback(() => {
    if (!uploadedFile?.data) return;

    setIsCalculating(true);

    try {
      const calculatedItems = uploadedFile.data.map((item, index) => {
        const purchaseDate = new Date(
          item.purchaseDate || item.PurchaseDate || item.uatDate || Date.now()
        );
        const warrantyPeriod = parseInt(
          item.warrantyPeriod || item.WarrantyPeriod || item.warrantyYears || 36
        ); // months
        const warrantyStartDate = new Date(
          item.warrantyStartDate || item.WarrantyStartDate || purchaseDate
        );
        const warrantyEndDate = new Date(warrantyStartDate);
        warrantyEndDate.setMonth(warrantyEndDate.getMonth() + warrantyPeriod);

        const today = new Date();
        const daysRemaining = Math.ceil(
          (warrantyEndDate - today) / (1000 * 60 * 60 * 24)
        );

        let status = "active";
        let alertLevel = "safe";

        if (daysRemaining < 0) {
          status = "expired";
          alertLevel = "danger";
        } else if (daysRemaining <= 30) {
          status = "expiring_soon";
          alertLevel = "critical";
        } else if (daysRemaining <= 90) {
          status = "expiring_within_3_months";
          alertLevel = "warning";
        }

        // Calculate quarterly warranty schedule
        const quarterlySchedule = calculateWarrantyQuarters(
          warrantyStartDate,
          warrantyEndDate,
          parseFloat(item.price || item.Price || item.cost || 0)
        );

        return {
          id: index,
          productName:
            item.productName ||
            item.ProductName ||
            item.itemName ||
            "Unknown Product",
          location: item.location || item.Location || "Unknown Location",
          serialNumber:
            item.serialNumber || item.SerialNumber || item.serialNo || "N/A",
          category: item.category || item.Category || "General",
          purchaseDate: purchaseDate.toISOString().split("T")[0],
          warrantyStartDate: warrantyStartDate.toISOString().split("T")[0],
          warrantyEndDate: warrantyEndDate.toISOString().split("T")[0],
          warrantyPeriod: warrantyPeriod,
          daysRemaining: daysRemaining,
          status: status,
          alertLevel: alertLevel,
          originalPrice: parseFloat(item.price || item.Price || item.cost || 0),
          quarterlySchedule: quarterlySchedule,
          totalWarrantyCost: quarterlySchedule.reduce(
            (sum, q) => sum + q.amount,
            0
          ),
        };
      });

      dispatch(setWarrantyCalculatedData(calculatedItems));

      // Initialize payment data
      const paymentData = [];
      calculatedItems.forEach((item) => {
        item.quarterlySchedule.forEach((quarter) => {
          paymentData.push({
            id: `${item.id}-${quarter.id}`,
            productId: item.id,
            quarterId: quarter.id,
            productName: item.productName,
            location: item.location,
            quarter: quarter.quarter,
            year: quarter.year,
            amount: quarter.amount,
            dueDate: quarter.dueDate,
            isPaid: false,
            paidDate: null,
          });
        });
      });

      dispatch(setWarrantyPaymentData(paymentData));
    } catch (error) {
      console.error("Error calculating warranty schedules:", error);
    } finally {
      setIsCalculating(false);
    }
  }, [uploadedFile, dispatch]);

  // Calculate quarterly warranty payments
  const calculateWarrantyQuarters = (startDate, endDate, productCost) => {
    const quarters = [];
    const warrantyPercentage = 0.15; // 15% of product cost for warranty
    const totalWarrantyCost = productCost * warrantyPercentage;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalMonths = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30));
    const quarterlyAmount = totalWarrantyCost / Math.ceil(totalMonths / 3);

    let currentDate = new Date(start);
    let quarterId = 0;

    while (currentDate < end) {
      const quarterEnd = new Date(currentDate);
      quarterEnd.setMonth(quarterEnd.getMonth() + 3);

      if (quarterEnd > end) {
        quarterEnd.setTime(end.getTime());
      }

      const quarter = getQuarterName(currentDate);
      const year = currentDate.getFullYear();

      quarters.push({
        id: quarterId++,
        quarter: quarter,
        year: year,
        startDate: currentDate.toISOString().split("T")[0],
        endDate: quarterEnd.toISOString().split("T")[0],
        dueDate: quarterEnd.toISOString().split("T")[0],
        amount: quarterlyAmount,
        amountWithGst: quarterlyAmount * 1.18,
      });

      currentDate = new Date(quarterEnd);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return quarters;
  };

  // Get quarter name based on date
  const getQuarterName = (date) => {
    const month = date.getMonth();
    if (month >= 0 && month <= 2) return "JFM";
    if (month >= 3 && month <= 5) return "AMJ";
    if (month >= 6 && month <= 8) return "JAS";
    return "OND";
  };

  // Filtered data based on current filters
  const filteredData = useMemo(() => {
    if (!warrantyData) return [];

    let filtered = warrantyData.filter((item) => {
      const locationMatch =
        warrantyFilters.location === "All Locations" ||
        item.location === warrantyFilters.location;

      const statusMatch =
        warrantyFilters.status === "all" ||
        item.status === warrantyFilters.status;

      const dateMatch =
        !warrantyFilters.dateRange.start ||
        !warrantyFilters.dateRange.end ||
        (item.warrantyEndDate >= warrantyFilters.dateRange.start &&
          item.warrantyEndDate <= warrantyFilters.dateRange.end);

      return locationMatch && statusMatch && dateMatch;
    });

    return filtered;
  }, [warrantyData, warrantyFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredData.slice(startIndex, endIndex);

  // Statistics for dashboard
  const stats = useMemo(() => {
    if (!warrantyData) return { total: 0, active: 0, expiring: 0, expired: 0 };

    return {
      total: warrantyData.length,
      active: warrantyData.filter((item) => item.status === "active").length,
      expiring: warrantyData.filter(
        (item) =>
          item.status === "expiring_soon" ||
          item.status === "expiring_within_3_months"
      ).length,
      expired: warrantyData.filter((item) => item.status === "expired").length,
    };
  }, [warrantyData]);

  // Chart data
  const statusChartData = useMemo(() => {
    if (!warrantyData) return [];

    const statusCounts = warrantyData.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace(/_/g, " ").toUpperCase(),
      count,
      color: getStatusColor(status),
    }));
  }, [warrantyData]);

  const expirationTimelineData = useMemo(() => {
    if (!warrantyData) return [];

    const monthCounts = {};
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthKey = month.toISOString().substring(0, 7);
      monthCounts[monthKey] = 0;
    }

    warrantyData.forEach((item) => {
      const expirationMonth = item.warrantyEndDate.substring(0, 7);
      if (monthCounts.hasOwnProperty(expirationMonth)) {
        monthCounts[expirationMonth]++;
      }
    });

    return Object.entries(monthCounts).map(([month, count]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      count,
    }));
  }, [warrantyData]);

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#10B981";
      case "expiring_soon":
        return "#F59E0B";
      case "expiring_within_3_months":
        return "#EF4444";
      case "expired":
        return "#6B7280";
      default:
        return "#3B82F6";
    }
  };

  const getStatusBadgeStyle = (status) => {
    const baseStyle = {
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "0.75rem",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    };

    switch (status) {
      case "active":
        return { ...baseStyle, backgroundColor: "#D1FAE5", color: "#065F46" };
      case "expiring_soon":
        return { ...baseStyle, backgroundColor: "#FEF3C7", color: "#92400E" };
      case "expiring_within_3_months":
        return { ...baseStyle, backgroundColor: "#FEE2E2", color: "#991B1B" };
      case "expired":
        return { ...baseStyle, backgroundColor: "#F3F4F6", color: "#374151" };
      default:
        return { ...baseStyle, backgroundColor: "#DBEAFE", color: "#1E40AF" };
    }
  };

  // Event handlers
  const handleFilterChange = (filterType, value) => {
    dispatch(setFilters({ [filterType]: value }));
    setCurrentPage(1);
  };

  const handlePaymentToggle = (productId, quarterId) => {
    const payment = warrantyData
      .find((p) => p.id === productId)
      ?.quarterlySchedule.find((q) => q.id === quarterId);

    if (payment) {
      dispatch(
        updateWarrantyPaymentStatus({
          productId,
          quarterId,
          isPaid: !payment.isPaid,
        })
      );
    }
  };

  // Export functionality
  const exportToExcel = () => {
    const exportData = filteredData.map((item) => ({
      "Product Name": item.productName,
      Location: item.location,
      "Serial Number": item.serialNumber,
      Category: item.category,
      "Purchase Date": item.purchaseDate,
      "Warranty Start": item.warrantyStartDate,
      "Warranty End": item.warrantyEndDate,
      "Days Remaining": item.daysRemaining,
      Status: item.status.replace(/_/g, " ").toUpperCase(),
      "Original Price": item.originalPrice,
      "Total Warranty Cost": item.totalWarrantyCost.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Warranty Tracker");
    XLSX.writeFile(
      wb,
      `Warranty_Tracker_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  // Get unique locations for filter
  const uniqueLocations = useMemo(() => {
    if (!warrantyData) return ["All Locations"];
    const locations = [...new Set(warrantyData.map((item) => item.location))];
    return ["All Locations", ...locations];
  }, [warrantyData]);

  // Consistent styling with glassmorphism theme
  const styles = {
    container: {
      minHeight: "100vh",
      background:
        "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
      color: "white",
      fontFamily:
        '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: "relative",
    },
    backgroundOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)
      `,
      pointerEvents: "none",
    },
    innerContainer: {
      maxWidth: "1400px",
      margin: "0 auto",
      padding: isMobile ? "24px" : "48px",
      position: "relative",
      zIndex: 1,
    },
    backButton: {
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      color: "#1e293b",
      padding: "12px 24px",
      borderRadius: "12px",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "24px",
      fontSize: "0.875rem",
      fontWeight: 600,
      transition: "all 0.2s ease-in-out",
      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
    },
    welcomeHeader: {
      background: "rgba(255, 255, 255, 0.08)",
      backdropFilter: "blur(20px)",
      borderRadius: "20px",
      padding: "32px",
      marginBottom: "40px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    },
    card: {
      background: "rgba(255, 255, 255, 0.08)",
      backdropFilter: "blur(20px)",
      borderRadius: "20px",
      padding: "32px",
      marginBottom: "32px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
      gap: "20px",
      marginBottom: "32px",
    },
    statCard: {
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(10px)",
      padding: "24px",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      textAlign: "center",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundOverlay}></div>

      <div style={styles.innerContainer}>
        {/* Back Button */}
        <button
          style={styles.backButton}
          onClick={() => navigate("/")}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 12px 25px rgba(0, 0, 0, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0px)";
            e.target.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.15)";
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        {/* Header Section */}
        <div style={styles.welcomeHeader}>
          <div className="flex justify-between items-center flex-wrap gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Warranty Tracker
              </h1>
              <p className="text-xl text-blue-200 mb-2">
                Monitor warranty periods and track expiration timelines
              </p>
              {uploadedFile && (
                <div className="inline-block px-4 py-2 bg-white/10 rounded-lg text-sm text-gray-300">
                  📊 Data Source: {uploadedFile.fileName}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Package size={32} className="text-white" />
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Current Time</div>
                <div className="text-lg font-semibold text-white">
                  {currentTime} IST
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        {!warrantyData && (
          <div style={styles.card}>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Calculate Warranty Schedules
            </h2>
            <p className="text-gray-300 mb-6">
              Process your uploaded data to calculate warranty periods and
              expiration timelines.
            </p>
            <button
              onClick={calculateWarrantySchedules}
              disabled={isCalculating}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 transition-all hover:scale-105 flex items-center gap-3"
            >
              {isCalculating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Calculating...
                </>
              ) : (
                <>
                  <Calendar size={20} />
                  Calculate Warranty Schedules
                </>
              )}
            </button>
          </div>
        )}

        {warrantyData && (
          <>
            {/* Statistics Cards */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <Package size={24} className="mx-auto mb-3 text-blue-400" />
                <div className="text-3xl font-bold text-white mb-1">
                  {stats.total}
                </div>
                <div className="text-sm text-gray-400">Total Products</div>
              </div>
              <div style={styles.statCard}>
                <CheckCircle
                  size={24}
                  className="mx-auto mb-3 text-green-400"
                />
                <div className="text-3xl font-bold text-green-400 mb-1">
                  {stats.active}
                </div>
                <div className="text-sm text-gray-400">Active Warranties</div>
              </div>
              <div style={styles.statCard}>
                <AlertTriangle
                  size={24}
                  className="mx-auto mb-3 text-yellow-400"
                />
                <div className="text-3xl font-bold text-yellow-400 mb-1">
                  {stats.expiring}
                </div>
                <div className="text-sm text-gray-400">Expiring Soon</div>
              </div>
              <div style={styles.statCard}>
                <XCircle size={24} className="mx-auto mb-3 text-red-400" />
                <div className="text-3xl font-bold text-red-400 mb-1">
                  {stats.expired}
                </div>
                <div className="text-sm text-gray-400">Expired</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Status Distribution Chart */}
              <div style={styles.card}>
                <h3 className="text-xl font-bold mb-6 text-white">
                  Warranty Status Distribution
                </h3>
                <div style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percent }) =>
                          `${status} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expiration Timeline Chart */}
              <div style={styles.card}>
                <h3 className="text-xl font-bold mb-6 text-white">
                  Warranty Expiration Timeline
                </h3>
                <div style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={expirationTimelineData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.1)"
                      />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255,255,255,0.95)",
                          border: "none",
                          borderRadius: "8px",
                          color: "#1e293b",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: "#3B82F6", strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Filters and Export */}
            <div style={styles.card}>
              <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Location
                    </label>
                    <select
                      value={warrantyFilters.location}
                      onChange={(e) =>
                        handleFilterChange("location", e.target.value)
                      }
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {uniqueLocations.map((location) => (
                        <option
                          key={location}
                          value={location}
                          className="bg-gray-800"
                        >
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={warrantyFilters.status}
                      onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                      }
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all" className="bg-gray-800">
                        All Status
                      </option>
                      <option value="active" className="bg-gray-800">
                        Active
                      </option>
                      <option value="expiring_soon" className="bg-gray-800">
                        Expiring Soon
                      </option>
                      <option
                        value="expiring_within_3_months"
                        className="bg-gray-800"
                      >
                        Expiring Within 3 Months
                      </option>
                      <option value="expired" className="bg-gray-800">
                        Expired
                      </option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={exportToExcel}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold transition-all hover:scale-105 flex items-center gap-2"
                >
                  <Download size={16} />
                  Export to Excel
                </button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-xl border border-white/20">
                <table className="min-w-full divide-y divide-white/20">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Product Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Warranty Period
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Days Remaining
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/5 divide-y divide-white/10">
                    {currentItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-white/10 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {item.productName}
                            </div>
                            <div className="text-sm text-gray-400">
                              S/N: {item.serialNumber}
                            </div>
                            <div className="text-sm text-gray-400">
                              ₹{item.originalPrice.toLocaleString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-300">
                            <MapPin size={14} className="mr-2 text-gray-400" />
                            {item.location}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div>Start: {item.warrantyStartDate}</div>
                          <div>End: {item.warrantyEndDate}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span style={getStatusBadgeStyle(item.status)}>
                            {item.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <Clock size={14} className="mr-2 text-gray-400" />
                            <span
                              className={`font-medium ${
                                item.daysRemaining < 0
                                  ? "text-red-400"
                                  : item.daysRemaining <= 30
                                  ? "text-yellow-400"
                                  : "text-green-400"
                              }`}
                            >
                              {item.daysRemaining < 0
                                ? "Expired"
                                : `${item.daysRemaining} days`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() =>
                              navigate("/warranty-payment-tracker")
                            }
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            View Payment Schedule
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-gray-300 bg-white/5 hover:bg-white/10 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-gray-300 bg-white/5 hover:bg-white/10 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      Showing{" "}
                      <span className="font-medium text-white">
                        {startIndex + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium text-white">
                        {Math.min(endIndex, filteredData.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-white">
                        {filteredData.length}
                      </span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-white/20 bg-white/5 text-sm font-medium text-gray-300 hover:bg-white/10 disabled:opacity-50"
                      >
                        First
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-2 border border-white/20 bg-white/5 text-sm font-medium text-gray-300 hover:bg-white/10 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-white/20 bg-white/10 text-sm font-medium text-white">
                        {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-3 py-2 border border-white/20 bg-white/5 text-sm font-medium text-gray-300 hover:bg-white/10 disabled:opacity-50"
                      >
                        Next
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-white/20 bg-white/5 text-sm font-medium text-gray-300 hover:bg-white/10 disabled:opacity-50"
                      >
                        Last
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WarrantyTracker;
