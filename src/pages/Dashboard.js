//dashboard-redux.js
import React, { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import * as XLSX from "xlsx";

// Redux Actions
import {
  processExcelFile,
  loadExcelFromMemory,
  setActiveSheet,
  clearData as clearExcelData,
} from "../store/slice/excelSlice";

import {
  storeAMCCalculations,
  loadAMCFromMemory,
  clearData,
} from "../store/slice/amcScheduleSlice";

import {
  storeWarrantyCalculations,
  loadWarrantyFromMemory,
  clearWarrantyData,
} from "../store/slice/warrantyDataSlice";

import {
  setHoveredCard,
  setHoveredButton,
  setHoveredLink,
  setIsMobile,
  setCurrentTime,
  setSearchTerm,
  setSelectedCategory,
  toggleNotifications,
  updateStats,
  toggleDarkMode,
  toggleQuickTips,
  setCurrentTip,
  nextTip,
  setShowSearch,
  toggleSearch,
} from "../store/slice/dashboardSlice";

// Redux Selectors
import {
  selectExcelData,
  selectFileName,
  selectSheets,
  selectActiveSheet,
  selectIsLoading,
  selectError,
  selectUploadHistory,
  selectHasData,
  selectTotalRows,
  selectSheetData,
} from "../store/selectors/excelSelectors";

import {
  selectAMCCalculations,
  selectAMCMetadata,
  selectAMCHistory,
  selectAMCIsProcessing,
  selectHasAMCData,
  selectTotalAMCAssets,
  selectTotalAMCValue,
  selectAMCCalculationsForPayments,
} from "../store/selectors/amcDataSelectors";

import {
  selectWarrantyCalculations,
  selectWarrantyMetadata,
  selectWarrantyHistory,
  selectWarrantyIsProcessing,
  selectHasWarrantyData,
  selectTotalWarrantyAssets,
  selectTotalWarrantyValue,
  selectWarrantyCalculationsForPayments,
} from "../store/selectors/warrantyDataSelectors";

import {
  selectHoveredCard,
  selectHoveredButton,
  selectHoveredLink,
  selectIsMobile,
  selectCurrentTime,
  selectSearchTerm,
  selectSelectedCategory,
  selectNotifications,
  selectShowNotifications,
  selectStats,
  selectIsDarkMode,
  selectShowQuickTips,
  selectCurrentTip,
  selectShowSearch,
  selectRecentActivity,
  selectFilteredTools,
} from "../store/selectors/dashboardSelectors";

// ================================
// EXCEL UPLOAD SECTION COMPONENT (Redux Version)
// ================================
const ExcelUploadSection = ({ isDarkMode }) => {
  const dispatch = useDispatch();

  // Excel selectors
  const excelData = useSelector(selectExcelData);
  const fileName = useSelector(selectFileName);
  const sheets = useSelector(selectSheets);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const hasData = useSelector(selectHasData);
  const totalRows = useSelector(selectTotalRows);

  // AMC selectors
  const hasAMCData = useSelector(selectHasAMCData);
  const totalAMCAssets = useSelector(selectTotalAMCAssets);
  const totalAMCValue = useSelector(selectTotalAMCValue);

  // Warranty selectors
  const hasWarrantyData = useSelector(selectHasWarrantyData);
  const totalWarrantyAssets = useSelector(selectTotalWarrantyAssets);
  const totalWarrantyValue = useSelector(selectTotalWarrantyValue);

  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    async (file) => {
      if (!file) {
        console.error("❌ No file provided to handleFile");
        return;
      }

      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        ".xlsx",
        ".xls",
      ];

      const isValidType = validTypes.some(
        (type) => file.type === type || file.name.toLowerCase().endsWith(type)
      );

      if (!isValidType) {
        console.error("❌ Invalid file type:", file.type);
        alert("Please upload a valid Excel file (.xlsx or .xls)");
        return;
      }

      try {
        // Dispatch the action and wait for it to complete
        const result = await dispatch(processExcelFile(file));
        console.log("📊 processExcelFile result:", result);

        // Check if the action was successful
        if (result.type && result.type.endsWith("/fulfilled")) {
          console.log("🎉 FILE UPLOADED SUCCESSFULLY! 🎉");
          console.log("📈 Excel data processed and stored in Redux store");

          // Show success notification
          alert("✅ File uploaded successfully!");
        } else if (result.type && result.type.endsWith("/rejected")) {
          console.error("❌ File upload failed:", result.error);
        }
      } catch (error) {
        console.error("❌ Error during file processing:", error);
      }
    },
    [dispatch]
  );

  // Add useEffect to monitor state changes
  useEffect(() => {
    console.log("📊 Excel state updated:", {
      hasData,
      fileName,
      sheetsCount: sheets?.length || 0,
      totalRows,
      isLoading,
      error,
    });

    if (hasData && fileName) {
      console.log("🎯 Excel data is now available in Redux store!");
      console.log(
        "📋 Available sheets:",
        sheets.map((sheet) => sheet.name)
      );
    }
  }, [hasData, fileName, sheets, totalRows, isLoading, error]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("📁 Drag event:", e.type);

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      console.log("📁 File dropped!");
      console.log("📁 Files in drop:", e.dataTransfer.files.length);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        console.log("📁 Processing dropped file...");
        handleFile(e.dataTransfer.files[0]);
      } else {
        console.error("❌ No files found in drop event");
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e) => {
      console.log("📁 File input changed");
      console.log("📁 Files selected:", e.target.files?.length || 0);

      if (e.target.files && e.target.files[0]) {
        console.log("📁 Processing selected file...");
        handleFile(e.target.files[0]);
      } else {
        console.error("❌ No files found in file input");
      }
    },
    [handleFile]
  );

  const handleClearAllData = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to clear all data? This will remove Excel files, AMC calculations, and Warranty calculations."
      )
    ) {
      console.log("🗑️ Clearing all data...");
      dispatch(clearExcelData());
      dispatch(clearData());
      dispatch(clearWarrantyData());
      console.log("✅ All data cleared");
    }
  }, [dispatch]);

  return (
    <div
      style={{
        background: isDarkMode
          ? "rgba(55, 65, 81, 0.95)"
          : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        borderRadius: "20px",
        padding: "32px",
        marginBottom: "40px",
        border: `1px solid ${
          isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(255, 255, 255, 0.2)"
        }`,
        boxShadow: isDarkMode
          ? "0 20px 40px -12px rgba(0, 0, 0, 0.3)"
          : "0 20px 40px -12px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: isDarkMode ? "#f1f5f9" : "#1e293b",
              marginBottom: "8px",
            }}
          >
            📊 Global Data Management Hub
          </h3>
          <p
            style={{
              color: isDarkMode ? "#94a3b8" : "#64748b",
              fontSize: "0.95rem",
              margin: 0,
            }}
          >
            Centralized data storage for Excel files, AMC calculations, and
            Warranty calculations
          </p>
        </div>
        {(hasData || hasAMCData || hasWarrantyData) && (
          <button
            onClick={handleClearAllData}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Clear All Data
          </button>
        )}
      </div>

      {/* Data Status Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {/* Excel Data Status */}
        <div
          style={{
            padding: "16px",
            backgroundColor: hasData
              ? isDarkMode
                ? "#064e3b"
                : "#f0fdf4"
              : isDarkMode
              ? "#374151"
              : "#f8fafc",
            border: `1px solid ${
              hasData
                ? isDarkMode
                  ? "#065f46"
                  : "#bbf7d0"
                : isDarkMode
                ? "#4b5563"
                : "#e2e8f0"
            }`,
            borderRadius: "12px",
          }}
        >
          <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
            {hasData ? "📊" : "📄"}
          </div>
          <h4
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: "4px",
              color: isDarkMode ? "#f1f5f9" : "#1e293b",
            }}
          >
            Excel Files
          </h4>
          <p
            style={{
              fontSize: "0.8rem",
              color: isDarkMode ? "#94a3b8" : "#64748b",
              margin: 0,
            }}
          >
            {hasData
              ? `${sheets.length} sheets, ${totalRows.toLocaleString()} rows`
              : "No files uploaded"}
          </p>
        </div>

        {/* AMC Data Status */}
        <div
          style={{
            padding: "16px",
            backgroundColor: hasAMCData
              ? isDarkMode
                ? "#1e3a8a"
                : "#eff6ff"
              : isDarkMode
              ? "#374151"
              : "#f8fafc",
            border: `1px solid ${
              hasAMCData
                ? isDarkMode
                  ? "#1d4ed8"
                  : "#bfdbfe"
                : isDarkMode
                ? "#4b5563"
                : "#e2e8f0"
            }`,
            borderRadius: "12px",
          }}
        >
          <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
            {hasAMCData ? "🔧" : "⚙️"}
          </div>
          <h4
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: "4px",
              color: isDarkMode ? "#f1f5f9" : "#1e293b",
            }}
          >
            AMC Calculations
          </h4>
          <p
            style={{
              fontSize: "0.8rem",
              color: isDarkMode ? "#94a3b8" : "#64748b",
              margin: 0,
            }}
          >
            {hasAMCData
              ? `${totalAMCAssets} assets, ₹${totalAMCValue.toLocaleString()}`
              : "No calculations stored"}
          </p>
        </div>

        {/* Warranty Data Status */}
        <div
          style={{
            padding: "16px",
            backgroundColor: hasWarrantyData
              ? isDarkMode
                ? "#92400e"
                : "#fef3c7"
              : isDarkMode
              ? "#374151"
              : "#f8fafc",
            border: `1px solid ${
              hasWarrantyData
                ? isDarkMode
                  ? "#d97706"
                  : "#fcd34d"
                : isDarkMode
                ? "#4b5563"
                : "#e2e8f0"
            }`,
            borderRadius: "12px",
          }}
        >
          <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
            {hasWarrantyData ? "🛡️" : "🔒"}
          </div>
          <h4
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: "4px",
              color: isDarkMode ? "#f1f5f9" : "#1e293b",
            }}
          >
            Warranty Calculations
          </h4>
          <p
            style={{
              fontSize: "0.8rem",
              color: isDarkMode ? "#94a3b8" : "#64748b",
              margin: 0,
            }}
          >
            {hasWarrantyData
              ? `${totalWarrantyAssets} assets, ₹${totalWarrantyValue.toLocaleString()}`
              : "No calculations stored"}
          </p>
        </div>
      </div>

      {/* Excel Upload Area */}
      <div
        style={{
          border: `2px dashed ${dragActive ? "#3b82f6" : isDarkMode ? "#4b5563" : "#cbd5e1"}`,
          borderRadius: "12px",
          padding: "32px",
          textAlign: "center",
          backgroundColor: dragActive
            ? isDarkMode
              ? "rgba(59, 130, 246, 0.1)"
              : "#f0f9ff"
            : hasData
            ? isDarkMode
              ? "rgba(5, 150, 105, 0.1)"
              : "#f0fdf4"
            : isDarkMode
            ? "#374151"
            : "#f8fafc",
          transition: "all 0.3s ease",
          position: "relative",
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div>
            <div style={{ fontSize: "2rem", marginBottom: "16px" }}>⏳</div>
            <p style={{ color: "#3b82f6", fontWeight: 600 }}>
              Processing Excel file...
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                color: isDarkMode ? "#94a3b8" : "#64748b",
              }}
            >
              Please wait while we process your file
            </p>
          </div>
        ) : hasData ? (
          <div>
            <div style={{ fontSize: "2rem", marginBottom: "16px" }}>✅</div>
            <p
              style={{ color: "#059669", fontWeight: 600, marginBottom: "8px" }}
            >
              Excel File Loaded Successfully
            </p>
            <p
              style={{
                color: isDarkMode ? "#94a3b8" : "#6b7280",
                fontSize: "0.9rem",
                marginBottom: "12px",
              }}
            >
              {fileName}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "24px",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  backgroundColor: isDarkMode ? "#4b5563" : "white",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  border: `1px solid ${isDarkMode ? "#6b7280" : "#e2e8f0"}`,
                }}
              >
                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#3b82f6",
                  }}
                >
                  {sheets.length}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: isDarkMode ? "#94a3b8" : "#64748b",
                  }}
                >
                  Sheets
                </div>
              </div>
              <div
                style={{
                  backgroundColor: isDarkMode ? "#4b5563" : "white",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  border: `1px solid ${isDarkMode ? "#6b7280" : "#e2e8f0"}`,
                }}
              >
                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#059669",
                  }}
                >
                  {totalRows.toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: isDarkMode ? "#94a3b8" : "#64748b",
                  }}
                >
                  Total Rows
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                console.log("📁 User clicked to upload different file");
                document.getElementById("excel-file-input").click();
              }}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Upload Different File
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "2rem", marginBottom: "16px" }}>📊</div>
            <p
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                marginBottom: "8px",
                color: isDarkMode ? "#f1f5f9" : "#374151",
              }}
            >
              Upload Excel File
            </p>
            <p
              style={{
                color: isDarkMode ? "#94a3b8" : "#6b7280",
                marginBottom: "16px",
                fontSize: "0.9rem",
              }}
            >
              Drag and drop your Excel file here, or click to browse
            </p>
            <button
              onClick={() => {
                console.log("📁 User clicked to choose file");
                document.getElementById("excel-file-input").click();
              }}
              style={{
                padding: "12px 24px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
            >
              Choose File
            </button>
          </div>
        )}

        <input
          id="excel-file-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          style={{ display: "none" }}
        />
      </div>

      {error && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: isDarkMode ? "#7f1d1d" : "#fef2f2",
            border: `1px solid ${isDarkMode ? "#991b1b" : "#fecaca"}`,
            borderRadius: "8px",
            color: isDarkMode ? "#fca5a5" : "#dc2626",
            fontSize: "0.875rem",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Data Flow Information */}
      {(hasData || hasAMCData || hasWarrantyData) && (
        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            backgroundColor: isDarkMode ? "#1e3a8a" : "#f0f9ff",
            border: `1px solid ${isDarkMode ? "#1d4ed8" : "#bfdbfe"}`,
            borderRadius: "12px",
          }}
        >
          <h4
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: "12px",
              color: isDarkMode ? "#f1f5f9" : "#1e293b",
            }}
          >
            🔄 Data Flow Status
          </h4>
          <div
            style={{
              fontSize: "0.8rem",
              color: isDarkMode ? "#94a3b8" : "#64748b",
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: "4px 0" }}>
              • <strong>Excel Files:</strong>{" "}
              {hasData
                ? "Available for AMC/Warranty calculations"
                : "Upload required"}
            </p>
            <p style={{ margin: "4px 0" }}>
              • <strong>AMC Calculations:</strong>{" "}
              {hasAMCData
                ? "Ready for Payment Tracker"
                : "Run AMC Calculator first"}
            </p>
            <p style={{ margin: "4px 0" }}>
              • <strong>Warranty Calculations:</strong>{" "}
              {hasWarrantyData
                ? "Ready for Payment Tracker"
                : "Run Warranty Calculator first"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ================================
// MAIN DASHBOARD COMPONENT (Redux Version)
// ================================
function EnhancedUIDAIDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Dashboard selectors
  const hoveredCard = useSelector(selectHoveredCard);
  const hoveredButton = useSelector(selectHoveredButton);
  const hoveredLink = useSelector(selectHoveredLink);
  const isMobile = useSelector(selectIsMobile);
  const currentTime = useSelector(selectCurrentTime);
  const searchTerm = useSelector(selectSearchTerm);
  const selectedCategory = useSelector(selectSelectedCategory);
  const notifications = useSelector(selectNotifications);
  const showNotifications = useSelector(selectShowNotifications);
  const stats = useSelector(selectStats);
  const isDarkMode = useSelector(selectIsDarkMode);
  const showQuickTips = useSelector(selectShowQuickTips);
  const currentTip = useSelector(selectCurrentTip);
  const showSearch = useSelector(selectShowSearch);
  const recentActivity = useSelector(selectRecentActivity);

  // Data selectors for global context
  const hasExcelData = useSelector(selectHasData);
  const hasAMCData = useSelector(selectHasAMCData);
  const totalAMCAssets = useSelector(selectTotalAMCAssets);
  const totalAMCValue = useSelector(selectTotalAMCValue);
  const hasWarrantyData = useSelector(selectHasWarrantyData);
  const totalWarrantyAssets = useSelector(selectTotalWarrantyAssets);
  const totalWarrantyValue = useSelector(selectTotalWarrantyValue);

  useEffect(() => {
    const savedExcel = localStorage.getItem("excelData");
    const savedAMC = localStorage.getItem("amcData");
    const savedWarranty = localStorage.getItem("warrantyData");

    if (savedExcel) dispatch(loadExcelFromMemory());
    if (savedAMC) dispatch(loadAMCFromMemory());
    if (savedWarranty) dispatch(loadWarrantyFromMemory());
  }, [dispatch]);

  // Initialize responsive behavior and real-time clock
  useEffect(() => {
    const handleResize = () => {
      dispatch(setIsMobile(window.innerWidth <= 768));
    };

    const updateTime = () => {
      const time = new Date().toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      });
      dispatch(setCurrentTime(time));
    };

    // Initialize
    handleResize();
    updateTime();

    // Set up event listeners
    window.addEventListener("resize", handleResize);
    const timeInterval = setInterval(updateTime, 1000);

    // Simulate real-time stats updates
    const statsInterval = setInterval(() => {
      dispatch(
        updateStats({
          usersOnline: stats.usersOnline + Math.floor(Math.random() * 10) - 5,
          tasksCompleted: stats.tasksCompleted + Math.floor(Math.random() * 3),
        })
      );
    }, 30000);

    // Auto-rotate tips
    const tipsInterval = setInterval(() => {
      dispatch(nextTip());
    }, 5000);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(timeInterval);
      clearInterval(statsInterval);
      clearInterval(tipsInterval);
    };
  }, [dispatch, stats.usersOnline, stats.tasksCompleted]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        dispatch(setShowSearch(true));
      }
      if (e.key === "Escape") {
        dispatch(setShowSearch(false));
        dispatch(toggleNotifications());
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [dispatch]);

  // Navigation handler for tool cards
  const handleNavigation = useCallback(
    (path, toolName) => {
    
      try {
        navigate(path);
        
      } catch (error) {
        console.error(`❌ Navigation failed for ${toolName}:`, error);
      }
    },
    [navigate]
  );

  // Tool data for filtering - Enhanced with data availability indicators
  const tools = [
    {
      id: "amc",
      title: "AMC Calculator",
      category: "financial",
      description:
        "No more manual AMC calculations — just upload your sheet, and let the tool handle everything!",
      icon: "📊",
      path: "/enhanced-amc-calculator",
      tag: "Financial Planning",
      dataStatus: hasExcelData ? "ready" : "needs-data",
      statusText: hasExcelData
        ? "Excel data available"
        : "Upload Excel file first",
    },
    {
      id: "warranty",
      title: "Warranty Estimator",
      category: "risk",
      description:
        "Your digital assistant for warranty tracking — smart calculator, export-ready, and easy to use.",
      icon: "🛡️",
      path: "/warranty-estimator",
      tag: "Risk Management",
      dataStatus: hasExcelData ? "ready" : "needs-data",
      statusText: hasExcelData
        ? "Excel data available"
        : "Upload Excel file first",
    },
    {
      id: "payment",
      title: "AMC Payment Tracker",
      category: "financial",
      description:
        "Comprehensive AMC payment tracking system with real-time transaction monitoring and automated invoice generation.",
      icon: "💳",
      path: "/payment-tracker",
      tag: "Financial Monitoring",
      dataStatus: hasAMCData ? "ready" : "needs-calculations",
      statusText: hasAMCData
        ? `${totalAMCAssets} AMC records available`
        : "Run AMC Calculator first",
    },
    {
      id: "warranty-tracker",
      title: "Warranty Payment Tracker",
      category: "financial",
      description:
        "Comprehensive warranty payment tracking system with real-time transaction monitoring and automated invoice generation.",
      icon: "🔍",
      path: "/warranty-payment-tracker",
      tag: "Financial Monitoring",
      dataStatus: hasWarrantyData ? "ready" : "needs-calculations",
      statusText: hasWarrantyData
        ? `${totalWarrantyAssets} warranty records available`
        : "Run Warranty Calculator first",
    },
  ];

  // Filter tools based on search and category using selector
  const filteredTools = useSelector((state) =>
    selectFilteredTools(state, tools)
  );

  // Event handlers using dispatch
  const handleMouseEnterCard = useCallback(
    (cardId) => {
      dispatch(setHoveredCard(cardId));
    },
    [dispatch]
  );

  const handleMouseLeaveCard = useCallback(() => {
    dispatch(setHoveredCard(null));
  }, [dispatch]);

  const handleMouseEnterButton = useCallback(
    (buttonId) => {
      dispatch(setHoveredButton(buttonId));
    },
    [dispatch]
  );

  const handleMouseLeaveButton = useCallback(() => {
    dispatch(setHoveredButton(null));
  }, [dispatch]);

  const handleMouseEnterLink = useCallback(
    (linkId) => {
      dispatch(setHoveredLink(linkId));
    },
    [dispatch]
  );

  const handleMouseLeaveLink = useCallback(() => {
    dispatch(setHoveredLink(null));
  }, [dispatch]);

  const handleSearchChange = useCallback(
    (e) => {
      dispatch(setSearchTerm(e.target.value));
    },
    [dispatch]
  );

  const handleCategoryChange = useCallback(
    (category) => {
      dispatch(setSelectedCategory(category));
    },
    [dispatch]
  );

  const handleToggleNotifications = useCallback(() => {
    dispatch(toggleNotifications());
  }, [dispatch]);

  const handleToggleDarkMode = useCallback(() => {
    dispatch(toggleDarkMode());
  }, [dispatch]);

  const handleToggleQuickTips = useCallback(() => {
    dispatch(toggleQuickTips());
  }, [dispatch]);

  const handleToggleSearch = useCallback(() => {
    dispatch(toggleSearch());
  }, [dispatch]);

  // ================================
  // COMPREHENSIVE STYLING SYSTEM
  // ================================

  const containerStyle = {
    minHeight: "100vh",
    background: isDarkMode
      ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
      : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
    color: isDarkMode ? "white" : "#1e293b",
    fontFamily:
      '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    display: "flex",
    flexDirection: "column",
    position: "relative",
    transition: "all 0.3s ease",
  };

  const backgroundOverlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: isDarkMode
      ? `
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)
    `
      : `
      radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)
    `,
    pointerEvents: "none",
  };

  // ================================
  // NAVBAR STYLING 
  // ================================

  const navbarStyle = {
    width: "100%",
    backgroundColor: isDarkMode
      ? "rgba(55, 65, 81, 0.95)"
      : "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(20px)",
    borderBottom: `1px solid ${
      isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(203, 213, 225, 0.5)"
    }`,
    color: isDarkMode ? "#f1f5f9" : "#1e293b",
    padding: "16px 20px",
    position: "relative",
    zIndex: 10,
    boxShadow: isDarkMode
      ? "0 4px 25px -12px rgba(0, 0, 0, 0.4)"
      : "0 4px 25px -12px rgba(0, 0, 0, 0.25)",
  };

  // Search Modal Styles (Updated for dark mode)
  const searchModalStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: showSearch ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const searchBoxStyle = {
    backgroundColor: isDarkMode ? "#374151" : "white",
    borderRadius: "16px",
    padding: "24px",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  };

  const searchInputStyle = {
    width: "100%",
    padding: "16px",
    fontSize: "1.1rem",
    border: `2px solid ${isDarkMode ? "#4b5563" : "#e2e8f0"}`,
    borderRadius: "12px",
    outline: "none",
    marginBottom: "16px",
    backgroundColor: isDarkMode ? "#1f2937" : "white",
    color: isDarkMode ? "#f1f5f9" : "#1e293b",
  };

  const mainContentStyle = {
    flex: 1,
    padding: isMobile ? "20px" : "40px",
    overflowY: "auto",
    position: "relative",
    zIndex: 1,
  };

  const toolCardStyle = (tool) => ({
    background: isDarkMode
      ? hoveredCard === tool.id
        ? "linear-gradient(135deg, rgba(55, 65, 81, 0.98) 0%, rgba(75, 85, 99, 0.95) 100%)"
        : "rgba(55, 65, 81, 0.95)"
      : hoveredCard === tool.id
      ? "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)"
      : "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "32px",
    border: `1px solid ${
      hoveredCard === tool.id
        ? "#3b82f6"
        : isDarkMode
        ? "rgba(75, 85, 99, 0.3)"
        : "rgba(255, 255, 255, 0.2)"
    }`,
    boxShadow:
      hoveredCard === tool.id
        ? isDarkMode
          ? "0 25px 50px -12px rgba(59, 130, 246, 0.4)"
          : "0 25px 50px -12px rgba(59, 130, 246, 0.25)"
        : isDarkMode
        ? "0 20px 40px -12px rgba(0, 0, 0, 0.3)"
        : "0 20px 40px -12px rgba(0, 0, 0, 0.15)",
    transform: hoveredCard === tool.id ? "translateY(-8px)" : "translateY(0)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
  });

  const toolIconStyle = {
    fontSize: "3rem",
    marginBottom: "20px",
    display: "block",
  };

  const toolTitleStyle = {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: isDarkMode ? "#f1f5f9" : "#1e293b",
    marginBottom: "12px",
    lineHeight: 1.2,
  };

  const toolDescriptionStyle = {
    color: isDarkMode ? "#94a3b8" : "#64748b",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    marginBottom: "20px",
  };

  const toolTagStyle = {
    display: "inline-block",
    padding: "6px 12px",
    backgroundColor: isDarkMode ? "#4b5563" : "#f1f5f9",
    color: isDarkMode ? "#d1d5db" : "#475569",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: 600,
    marginBottom: "16px",
  };

  const statusIndicatorStyle = (status) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 500,
    backgroundColor:
      status === "ready"
        ? isDarkMode
          ? "#064e3b"
          : "#f0fdf4"
        : isDarkMode
        ? "#92400e"
        : "#fef3c7",
    color:
      status === "ready"
        ? isDarkMode
          ? "#34d399"
          : "#059669"
        : isDarkMode
        ? "#fbbf24"
        : "#d97706",
    border: `1px solid ${
      status === "ready"
        ? isDarkMode
          ? "#065f46"
          : "#bbf7d0"
        : isDarkMode
        ? "#d97706"
        : "#fcd34d"
    }`,
  });

  const categoryFilterStyle = (category, isActive) => ({
    padding: "8px 16px",
    borderRadius: "20px",
    border: "none",
    backgroundColor: isActive
      ? "#3b82f6"
      : isDarkMode
      ? "rgba(55, 65, 81, 0.8)"
      : "rgba(255, 255, 255, 0.8)",
    color: isActive ? "white" : isDarkMode ? "#d1d5db" : "#64748b",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    backdropFilter: "blur(10px)",
  });

  // ================================
  // RENDER COMPONENT
  // ================================

  return (
    <div style={containerStyle}>
      <div style={backgroundOverlayStyle}></div>

      {/* Search Modal */}
      <div
        style={searchModalStyle}
        onClick={() => dispatch(setShowSearch(false))}
      >
        <div style={searchBoxStyle} onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            placeholder="Search tools and features..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={searchInputStyle}
            autoFocus
          />
          <div
            style={{
              fontSize: "0.875rem",
              color: isDarkMode ? "#9ca3af" : "#64748b",
            }}
          >
            Press <kbd>Escape</kbd> to close
          </div>
        </div>
      </div>

      {/* Navbar - Fixed for mobile responsiveness */}
      <div style={navbarStyle}>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "center" : "center",
            justifyContent: "space-between",
            gap: isMobile ? "12px" : "16px",
            width: "100%",
          }}
        >
          {/* Left Section - Brand with tri-color */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: "center",
              gap: isMobile ? "8px" : "24px",
            }}
          >
            <div style={{ textAlign: isMobile ? "center" : "left" }}>
              <h1 style={{ fontSize: isMobile ? "1.5rem" : "2rem", fontWeight: 800, margin: 0 }}>
              <span
                style={{
                  background: "linear-gradient(45deg, #FF6B35, #FFA500)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                SUVIDHA{" "}
              </span>
              <span
                style={{
                  background: "linear-gradient(45deg, #28A745, #28A745)", 
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                SETU
              </span>
            </h1>
              {!isMobile && (
                <p
                  style={{
                    color: isDarkMode ? "#94a3b8" : "#64748b",
                    fontSize: "0.85rem",
                    margin: 0,
                    lineHeight: 1.4,
                    maxWidth: "300px",
                    marginTop: "4px",
                  }}
                >
                  Advanced financial calculation suite with intelligent automation
                </p>
              )}
            </div>
          </div>

          {/* Right Section - Controls in responsive layout */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "8px" : "12px",
              flexWrap: "wrap",
              justifyContent: isMobile ? "center" : "flex-end",
            }}
          >
            {/* Current Time */}
            <div
              style={{
                fontSize: "0.75rem",
                color: isDarkMode ? "#94a3b8" : "#64748b",
                fontWeight: 600,
                padding: "6px 10px",
                backgroundColor: isDarkMode
                  ? "rgba(75, 85, 99, 0.8)"
                  : "rgba(248, 250, 252, 0.8)",
                borderRadius: "6px",
                border: `1px solid ${
                  isDarkMode ? "rgba(107, 114, 128, 0.3)" : "rgba(203, 213, 225, 0.3)"
                }`,
                whiteSpace: "nowrap",
              }}
            >
              🕒 {currentTime}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={handleToggleDarkMode}
              style={{
                padding: "6px 10px",
                backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",
                color: isDarkMode ? "#d1d5db" : "#374151",
                border: `1px solid ${
                  isDarkMode ? "rgba(107, 114, 128, 0.3)" : "rgba(203, 213, 225, 0.3)"
                }`,
                borderRadius: "6px",
                fontSize: "0.75rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {isDarkMode ? "🌙" : "☀️"}
            </button>

            {/* Search Button */}
            <button
              onClick={handleToggleSearch}
              style={{
                padding: "6px 10px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.75rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              🔍
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={mainContentStyle}>
        {/* Global Data Management Hub */}
        <ExcelUploadSection isDarkMode={isDarkMode} />

        {/* Category Filters */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "32px",
            flexWrap: "wrap",
          }}
        >
          {["all", "financial", "risk", "monitoring"].map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              style={categoryFilterStyle(
                category,
                selectedCategory === category
              )}
            >
              {category === "all"
                ? "🔍 All Tools"
                : category === "financial"
                ? "💰 Financial"
                : category === "risk"
                ? "🛡️ Risk Management"
                : "📊 Monitoring"}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "32px",
            marginBottom: "40px",
          }}
        >
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              style={toolCardStyle(tool)}
              onMouseEnter={() => handleMouseEnterCard(tool.id)}
              onMouseLeave={handleMouseLeaveCard}
              onClick={() => handleNavigation(tool.path, tool.title)}
            >
              {/* Tool Icon */}
              <div style={toolIconStyle}>{tool.icon}</div>

              {/* Tool Tag */}
              <div style={toolTagStyle}>{tool.tag}</div>

              {/* Tool Title */}
              <h3 style={toolTitleStyle}>{tool.title}</h3>

              {/* Tool Description */}
              <p style={toolDescriptionStyle}>{tool.description}</p>

              {/* Data Status */}
              <div style={statusIndicatorStyle(tool.dataStatus)}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor:
                      tool.dataStatus === "ready"
                        ? isDarkMode
                          ? "#34d399"
                          : "#10b981"
                        : isDarkMode
                        ? "#fbbf24"
                        : "#f59e0b",
                  }}
                ></div>
                {tool.statusText}
              </div>

              {/* Hover Effect Overlay */}
              {hoveredCard === tool.id && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)"
                      : "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
                    borderRadius: "20px",
                    pointerEvents: "none",
                  }}
                ></div>
              )}
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div
            style={{
              background: isDarkMode
                ? "rgba(55, 65, 81, 0.95)"
                : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              borderRadius: "20px",
              padding: "32px",
              border: `1px solid ${
                isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(255, 255, 255, 0.2)"
              }`,
              boxShadow: isDarkMode
                ? "0 20px 40px -12px rgba(0, 0, 0, 0.3)"
                : "0 20px 40px -12px rgba(0, 0, 0, 0.15)",
            }}
          >
            <h3
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: isDarkMode ? "#f1f5f9" : "#1e293b",
                marginBottom: "24px",
              }}
            >
              📈 Recent Activity
            </h3>
            <div style={{ space: "16px" }}>
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "16px",
                    backgroundColor: isDarkMode ? "#4b5563" : "#f8fafc",
                    borderRadius: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ fontSize: "1.5rem" }}>{activity.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: isDarkMode ? "#f3f4f6" : "#374151",
                        marginBottom: "4px",
                      }}
                    >
                      {activity.title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: isDarkMode ? "#94a3b8" : "#64748b",
                      }}
                    >
                      {activity.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "40px",
            padding: "20px",
            borderTop: `1px solid ${
              isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(203, 213, 225, 0.3)"
            }`,
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: isDarkMode ? "#6b7280" : "#9ca3af",
            }}
          >
            Suvidha Setu v1.0 - Advanced Financial Calculation Suite
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedUIDAIDashboard;