//WarrantyTracker.js
import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

// ================================
// GLOBAL CONTEXT STRUCTURE
// ================================

// Excel Context - For original uploaded Excel files
const ExcelContext = createContext();

// Warranty Data Context - For generated warranty calculation data
const WarrantyDataContext = createContext();

// ================================
// EXCEL PROVIDER COMPONENT (Original file uploads)
// ================================
const ExcelProvider = ({ children }) => {
  const [excelData, setExcelData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadHistory, setUploadHistory] = useState([]);

  // Load data from memory on component mount
  useEffect(() => {
    try {
      const savedData = window.excelGlobalData || null;
      if (savedData) {
        setExcelData(savedData.data);
        setFileName(savedData.fileName);
        setSheets(savedData.sheets);
        setActiveSheet(savedData.activeSheet);
        setUploadHistory(savedData.history || []);
      }
    } catch (error) {
      console.warn("Failed to load saved Excel data:", error);
    }
  }, []);

  // Save data to memory whenever it changes
  const saveToMemory = useCallback((data) => {
    try {
      window.excelGlobalData = data;
    } catch (error) {
      console.warn("Failed to save Excel data:", error);
    }
  }, []);

  // Process Excel file
  const processExcelFile = useCallback(
    async (file) => {
      setIsLoading(true);
      setError("");

      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        const sheetsData = {};
        const sheetNames = workbook.SheetNames;

        // Process all sheets
        sheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
            blankrows: false,
          });

          // Convert to objects with headers
          if (jsonData.length > 0) {
            const headers = jsonData[0];
            const rows = jsonData.slice(1).map((row) => {
              const obj = {};
              headers.forEach((header, index) => {
                obj[header] = row[index] || "";
              });
              return obj;
            });

            sheetsData[sheetName] = {
              headers,
              rows,
              raw: jsonData,
            };
          }
        });

        const newData = {
          data: sheetsData,
          fileName: file.name,
          sheets: sheetNames,
          activeSheet: sheetNames[0] || "",
          uploadTime: new Date().toISOString(),
          fileSize: file.size,
          history: [
            ...uploadHistory,
            {
              fileName: file.name,
              uploadTime: new Date().toISOString(),
              fileSize: file.size,
              sheetsCount: sheetNames.length,
            },
          ].slice(-5), // Keep last 5 uploads
        };

        setExcelData(sheetsData);
        setFileName(file.name);
        setSheets(sheetNames);
        setActiveSheet(sheetNames[0] || "");
        setUploadHistory(newData.history);

        // Save to memory
        saveToMemory(newData);

        return { success: true, data: sheetsData, sheets: sheetNames };
      } catch (err) {
        const errorMessage = `Failed to process Excel file: ${err.message}`;
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [uploadHistory, saveToMemory]
  );

  // Get data for specific sheet
  const getSheetData = useCallback(
    (sheetName = null) => {
      if (!excelData) return null;
      const targetSheet = sheetName || activeSheet;
      return excelData[targetSheet] || null;
    },
    [excelData, activeSheet]
  );

  // Clear data
  const clearData = useCallback(() => {
    setExcelData(null);
    setFileName("");
    setSheets([]);
    setActiveSheet("");
    setError("");
    delete window.excelGlobalData;
  }, []);

  const value = {
    excelData,
    fileName,
    sheets,
    activeSheet,
    isLoading,
    error,
    uploadHistory,
    processExcelFile,
    setActiveSheet,
    clearData,
    getSheetData,
    hasData: !!excelData,
    totalRows: excelData
      ? Object.values(excelData).reduce(
          (sum, sheet) => sum + sheet.rows.length,
          0
        )
      : 0,
  };

  return (
    <ExcelContext.Provider value={value}>{children}</ExcelContext.Provider>
  );
};

// ================================
// WARRANTY DATA PROVIDER COMPONENT (Generated warranty calculations)
// ================================
const WarrantyDataProvider = ({ children }) => {
  const [warrantyCalculations, setWarrantyCalculations] = useState(null);
  const [warrantyMetadata, setWarrantyMetadata] = useState(null);
  const [warrantyHistory, setWarrantyHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Warranty data from memory on component mount
  useEffect(() => {
    try {
      const savedWarrantyData = window.warrantyGlobalData || null;
      if (savedWarrantyData) {
        setWarrantyCalculations(savedWarrantyData.calculations);
        setWarrantyMetadata(savedWarrantyData.metadata);
        setWarrantyHistory(savedWarrantyData.history || []);
      }
    } catch (error) {
      console.warn("Failed to load saved Warranty data:", error);
    }
  }, []);

  // Save Warranty data to memory
  const saveWarrantyToMemory = useCallback((data) => {
    try {
      window.warrantyGlobalData = data;
      console.log("Warranty data saved to global memory:", data);
    } catch (error) {
      console.warn("Failed to save Warranty data:", error);
    }
  }, []);

  // Store Warranty calculation results
  const storeWarrantyCalculations = useCallback(
    (calculationData, sourceData) => {
      setIsProcessing(true);

      try {
        const timestamp = new Date().toISOString();
        const warrantyData = {
          calculations: calculationData,
          metadata: {
            calculationDate: timestamp,
            sourceFileName: sourceData.fileName || "Manual Input",
            totalAssets: calculationData.length,
            totalWarrantyValue: calculationData.reduce(
              (sum, item) => sum + (parseFloat(item.totalWarrantyCost) || 0),
              0
            ),
            calculationParameters: sourceData.parameters || {},
            dataSource: sourceData.source || "excel",
          },
          history: [
            ...warrantyHistory,
            {
              id: Date.now(),
              date: timestamp,
              assetsCount: calculationData.length,
              totalValue: calculationData.reduce(
                (sum, item) => sum + (parseFloat(item.totalWarrantyCost) || 0),
                0
              ),
              source: sourceData.fileName || "Manual Input",
            },
          ].slice(-10), // Keep last 10 calculations
        };

        setWarrantyCalculations(calculationData);
        setWarrantyMetadata(warrantyData.metadata);
        setWarrantyHistory(warrantyData.history);

        // Save to global memory
        saveWarrantyToMemory(warrantyData);

        return { success: true, data: warrantyData };
      } catch (error) {
        console.error("Failed to store Warranty calculations:", error);
        return { success: false, error: error.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [warrantyHistory, saveWarrantyToMemory]
  );

  // Get Warranty calculations for payment tracking
  const getWarrantyCalculationsForPayments = useCallback(() => {
    if (!warrantyCalculations) return null;

    // Transform Warranty calculations into payment-trackable format
    return warrantyCalculations.map((item, index) => ({
      id: item.id || `warranty-${index}`,
      itemName: item.itemName || item.assetName || `Asset ${index + 1}`,
      cost: parseFloat(item.cost) || 0,
      quantity: parseInt(item.quantity) || 1,
      uatDate:
        item.uatDate ||
        item.warrantyStartDate ||
        new Date().toISOString().split("T")[0],
      warrantyStartDate:
        item.warrantyStartDate || new Date().toISOString().split("T")[0],
      warrantyEndDate: item.warrantyEndDate,
      warrantyYears: parseInt(item.warrantyYears) || 3,
      location: item.location || "Not Specified",
    }));
  }, [warrantyCalculations]);

  // Clear Warranty data
  const clearWarrantyData = useCallback(() => {
    setWarrantyCalculations(null);
    setWarrantyMetadata(null);
    setWarrantyHistory([]);
    delete window.warrantyGlobalData;
  }, []);

  const value = {
    warrantyCalculations,
    warrantyMetadata,
    warrantyHistory,
    isProcessing,
    storeWarrantyCalculations,
    getWarrantyCalculationsForPayments,
    clearWarrantyData,
    hasWarrantyData: !!warrantyCalculations,
    totalWarrantyAssets: warrantyCalculations ? warrantyCalculations.length : 0,
    totalWarrantyValue: warrantyCalculations
      ? warrantyCalculations.reduce(
          (sum, item) => sum + (parseFloat(item.totalWarrantyCost) || 0),
          0
        )
      : 0,
  };

  return (
    <WarrantyDataContext.Provider value={value}>
      {children}
    </WarrantyDataContext.Provider>
  );
};

// ================================
// CUSTOM HOOKS FOR CONTEXT ACCESS
// ================================

// Custom hook to use Excel context
const useExcel = () => {
  const context = useContext(ExcelContext);
  if (!context) {
    throw new Error("useExcel must be used within an ExcelProvider");
  }
  return context;
};

// Custom hook to use Warranty data context
const useWarrantyData = () => {
  const context = useContext(WarrantyDataContext);
  if (!context) {
    throw new Error(
      "useWarrantyData must be used within a WarrantyDataProvider"
    );
  }
  return context;
};

// ================================
// ENHANCED WARRANTY PAYMENT TRACKER COMPONENT
// ================================
function WarrantyPaymentTracker() {
  // Access global contexts
  const { excelData, hasData, fileName, getSheetData } = useExcel();
  const { getWarrantyCalculationsForPayments, storeWarrantyCalculations } =
    useWarrantyData();

  // State management
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [location, setLocation] = useState("");
  const [showGST, setShowGST] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [hoveredButton, setHoveredButton] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [paymentFilter, setPaymentFilter] = useState("all"); // all, paid, pending, overdue
  const [searchTerm, setSearchTerm] = useState("");

  // Form state for adding payments
  const [paymentForm, setPaymentForm] = useState({
    productId: "",
    quarter: "",
    year: new Date().getFullYear(),
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "online",
    transactionId: "",
    remarks: "",
  });

  // Initialize clock
  useEffect(() => {
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
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Load warranty calculations from global data on mount
  useEffect(() => {
    const loadWarrantyData = () => {
      const warrantyCalcs = getWarrantyCalculationsForPayments();
      if (warrantyCalcs && warrantyCalcs.length > 0) {
        setProducts(warrantyCalcs);
        setUploadStatus(
          `Loaded ${warrantyCalcs.length} warranty records from calculations`
        );
      }
    };

    loadWarrantyData();
  }, [getWarrantyCalculationsForPayments]);

  // Load products from Excel data when available
  useEffect(() => {
    if (hasData && excelData) {
      processExcelDataToProducts();
    }
  }, [hasData, excelData]);

  // ================================
  // EXCEL DATA PROCESSING
  // ================================
  const processExcelDataToProducts = () => {
    try {
      setIsProcessing(true);
      setUploadStatus("Processing Excel data from dashboard...");

      let allProducts = [];

      // Process all sheets in the Excel data
      Object.keys(excelData).forEach((sheetName) => {
        const sheetData = excelData[sheetName];
        if (sheetData && sheetData.rows) {
          const processedProducts = sheetData.rows
            .map((row, index) => {
              const getColumnValue = (possibleNames) => {
                for (const name of possibleNames) {
                  const key = Object.keys(row).find((k) =>
                    k.toLowerCase().includes(name.toLowerCase())
                  );
                  if (
                    key &&
                    row[key] !== undefined &&
                    row[key] !== null &&
                    row[key] !== ""
                  ) {
                    return row[key];
                  }
                }
                return null;
              };

              const itemName =
                getColumnValue([
                  "item",
                  "name",
                  "product",
                  "description",
                  "asset",
                ]) || `Item ${index + 1}`;
              const cost =
                parseFloat(
                  getColumnValue(["cost", "price", "amount", "value"])
                ) || 0;
              const quantity =
                parseInt(getColumnValue(["quantity", "qty", "count"])) || 1;
              const uatDate =
                parseDate(
                  getColumnValue([
                    "uat",
                    "date",
                    "install",
                    "purchase",
                    "start",
                  ])
                ) || new Date().toISOString().split("T")[0];
              const warrantyYears =
                parseInt(
                  getColumnValue(["warranty", "years", "duration", "period"])
                ) || 3;
              const productLocation =
                getColumnValue(["location", "site", "place", "address"]) ||
                location ||
                "";

              const warrantyStartDate = uatDate;
              const warrantyEndDate = new Date(warrantyStartDate);
              warrantyEndDate.setFullYear(
                warrantyEndDate.getFullYear() + warrantyYears
              );

              return {
                id: `${sheetName}-${Date.now()}-${index}`,
                itemName,
                cost,
                quantity,
                uatDate,
                warrantyStartDate,
                warrantyEndDate: warrantyEndDate.toISOString().split("T")[0],
                warrantyYears,
                location: productLocation,
                sourceSheet: sheetName,
              };
            })
            .filter((product) => product.itemName && product.cost > 0);

          allProducts = [...allProducts, ...processedProducts];
        }
      });

      // Merge with existing products, avoiding duplicates
      const existingIds = new Set(products.map((p) => p.id));
      const newProducts = allProducts.filter((p) => !existingIds.has(p.id));

      if (newProducts.length > 0) {
        setProducts((prevProducts) => [...prevProducts, ...newProducts]);

        // Store warranty calculations in global context
        const warrantyCalcData = newProducts.map((product) => ({
          id: product.id,
          itemName: product.itemName,
          cost: product.cost,
          quantity: product.quantity,
          warrantyStartDate: product.warrantyStartDate,
          warrantyEndDate: product.warrantyEndDate,
          warrantyYears: product.warrantyYears,
          location: product.location,
          totalWarrantyCost: product.cost * 0.15 * product.warrantyYears, // 15% of cost per year
        }));

        storeWarrantyCalculations(warrantyCalcData, {
          fileName: fileName,
          source: "excel-dashboard",
          parameters: { warrantyPercentage: 15, defaultYears: 3 },
        });

        setUploadStatus(
          `Successfully processed ${newProducts.length} items from Excel data (${fileName})`
        );
      } else {
        setUploadStatus("Excel data processed - no new items found");
      }
    } catch (error) {
      setUploadStatus(`Error processing Excel data: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ================================
  // UTILITY FUNCTIONS
  // ================================

  const getQuarterDates = (year) => {
    return {
      OND: [new Date(year, 9, 5), new Date(year + 1, 0, 4)],
      JFM: [new Date(year + 1, 0, 5), new Date(year + 1, 3, 4)],
      AMJ: [new Date(year + 1, 3, 5), new Date(year + 1, 6, 4)],
      JAS: [new Date(year + 1, 6, 5), new Date(year + 1, 9, 4)],
    };
  };

  const calculateWarrantySchedule = (
    startDate,
    cost,
    gstRate = 0.18,
    warrantyPercent = 0.15,
    years = 3
  ) => {
    const schedule = {};
    const start = new Date(startDate);
    const yearlyAmount = (cost * warrantyPercent) / years;
    const quarterlyAmount = yearlyAmount / 4;

    const warrantyEnd = new Date(start);
    warrantyEnd.setFullYear(warrantyEnd.getFullYear() + years);
    warrantyEnd.setDate(warrantyEnd.getDate() - 1);

    for (
      let year = start.getFullYear() - 1;
      year <= warrantyEnd.getFullYear() + 1;
      year++
    ) {
      const quarters = getQuarterDates(year);

      for (const [qtrName, [qStart, qEnd]] of Object.entries(quarters)) {
        if (qEnd < start || qStart > warrantyEnd) continue;

        const overlapStart = new Date(
          Math.max(start.getTime(), qStart.getTime())
        );
        const overlapEnd = new Date(
          Math.min(warrantyEnd.getTime(), qEnd.getTime())
        );

        if (overlapStart > overlapEnd) continue;

        const totalDays =
          Math.floor((qEnd - qStart) / (1000 * 60 * 60 * 24)) + 1;
        const overlapDays =
          Math.floor((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
        const proratedAmount = (overlapDays / totalDays) * quarterlyAmount;

        const displayYear = qStart.getFullYear();
        const key = `${qtrName} ${displayYear}`;

        const withoutGST = Math.round(proratedAmount * 100) / 100;
        const withGST = Math.round(withoutGST * (1 + gstRate) * 100) / 100;

        if (!schedule[key]) {
          schedule[key] = { withGST: 0, withoutGST: 0, dueDate: qEnd };
        }
        schedule[key].withGST += withGST;
        schedule[key].withoutGST += withoutGST;
      }
    }

    return schedule;
  };

  const isOverdue = (dueDate) => {
    return new Date() > new Date(dueDate);
  };

  const getPaymentStatus = (productId, quarter) => {
    const payment = payments.find(
      (p) => p.productId === productId && p.quarter === quarter
    );
    if (payment) return "paid";

    // Check if overdue
    const product = products.find((p) => p.id === productId);
    if (product) {
      const schedule = calculateWarrantySchedule(
        product.warrantyStartDate,
        product.cost,
        0.18,
        0.15,
        product.warrantyYears
      );
      if (schedule[quarter] && isOverdue(schedule[quarter].dueDate)) {
        return "overdue";
      }
    }
    return "pending";
  };

  // ================================
  // FILE PROCESSING FUNCTIONS
  // ================================

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadStatus("Processing file...");

    try {
      const fileExtension = file.name.split(".").pop().toLowerCase();
      let data = [];

      if (fileExtension === "csv") {
        data = await parseCSV(file);
      } else if (["xlsx", "xls"].includes(fileExtension)) {
        data = await parseExcel(file);
      } else {
        throw new Error(
          "Unsupported file format. Please upload CSV or Excel files."
        );
      }

      processUploadedData(data);
      setUploadStatus(
        `Successfully processed ${data.length} items from ${file.name}`
      );
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  };

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(
              new Error("CSV parsing error: " + results.errors[0].message)
            );
          } else {
            resolve(results.data);
          }
        },
        error: (error) => reject(error),
      });
    });
  };

  const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const headers = data[0];
          const rows = data.slice(1).map((row) => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });

          resolve(rows);
        } catch (error) {
          reject(new Error("Excel parsing error: " + error.message));
        }
      };
      reader.onerror = () => reject(new Error("File reading error"));
      reader.readAsBinaryString(file);
    });
  };

  const processUploadedData = (data) => {
    const processedProducts = data
      .map((row, index) => {
        const getColumnValue = (possibleNames) => {
          for (const name of possibleNames) {
            const key = Object.keys(row).find((k) =>
              k.toLowerCase().includes(name.toLowerCase())
            );
            if (
              key &&
              row[key] !== undefined &&
              row[key] !== null &&
              row[key] !== ""
            ) {
              return row[key];
            }
          }
          return null;
        };

        const itemName =
          getColumnValue(["item", "name", "product", "description"]) ||
          `Item ${index + 1}`;
        const cost =
          parseFloat(getColumnValue(["cost", "price", "amount", "value"])) || 0;
        const quantity =
          parseInt(getColumnValue(["quantity", "qty", "count"])) || 1;
        const uatDate =
          parseDate(getColumnValue(["uat", "date", "install", "purchase"])) ||
          new Date().toISOString().split("T")[0];
        const warrantyYears =
          parseInt(getColumnValue(["warranty", "years", "duration"])) || 3;
        const productLocation =
          getColumnValue(["location", "site", "place", "address"]) ||
          location ||
          "";

        const warrantyStartDate = uatDate;
        const warrantyEndDate = new Date(warrantyStartDate);
        warrantyEndDate.setFullYear(
          warrantyEndDate.getFullYear() + warrantyYears
        );

        return {
          id: Date.now() + index,
          itemName,
          cost,
          quantity,
          uatDate,
          warrantyStartDate,
          warrantyEndDate: warrantyEndDate.toISOString().split("T")[0],
          warrantyYears,
          location: productLocation,
        };
      })
      .filter((product) => product.itemName && product.cost > 0);

    setProducts((prevProducts) => [...prevProducts, ...processedProducts]);
  };

  const parseDate = (dateValue) => {
    if (!dateValue) return null;

    if (typeof dateValue === "number") {
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(
        excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000
      );
      return date.toISOString().split("T")[0];
    }

    if (typeof dateValue === "string") {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    }

    return null;
  };

  // ================================
  // PAYMENT MANAGEMENT
  // ================================

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentForm.productId || !paymentForm.quarter || !paymentForm.amount)
      return;

    const product = products.find((p) => p.id === paymentForm.productId);
    if (!product) return;

    const newPayment = {
      id: Date.now(),
      productId: paymentForm.productId,
      productName: product.itemName,
      quarter: paymentForm.quarter,
      year: paymentForm.year,
      amount: parseFloat(paymentForm.amount),
      paymentDate: paymentForm.paymentDate,
      paymentMode: paymentForm.paymentMode,
      transactionId: paymentForm.transactionId,
      remarks: paymentForm.remarks,
      status: "completed",
    };

    setPayments([...payments, newPayment]);
    setPaymentForm({
      productId: "",
      quarter: "",
      year: new Date().getFullYear(),
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMode: "online",
      transactionId: "",
      remarks: "",
    });
  };

  const removePayment = (id) => {
    if (
      window.confirm("Are you sure you want to remove this payment record?")
    ) {
      setPayments(payments.filter((p) => p.id !== id));
    }
  };

  const exportPaymentReport = () => {
    const reportData = [];

    products.forEach((product) => {
      const schedule = calculateWarrantySchedule(
        product.warrantyStartDate,
        product.cost,
        0.18,
        0.15,
        product.warrantyYears
      );

      Object.entries(schedule).forEach(([quarter, amounts]) => {
        const payment = payments.find(
          (p) => p.productId === product.id && p.quarter === quarter
        );
        const status = getPaymentStatus(product.id, quarter);
        const dueAmount = showGST ? amounts.withGST : amounts.withoutGST;

        reportData.push({
          "Product Name": product.itemName,
          Quarter: quarter,
          "Due Amount": `₹${dueAmount.toFixed(2)}`,
          Status: status.toUpperCase(),
          "Payment Date": payment
            ? new Date(payment.paymentDate).toLocaleDateString("en-GB")
            : "",
          "Transaction ID": payment ? payment.transactionId : "",
          "Payment Mode": payment ? payment.paymentMode : "",
          Remarks: payment ? payment.remarks : "",
          Location: product.location,
        });
      });
    });

    const headers = Object.keys(reportData[0] || {});
    const csvContent = [
      headers.join(","),
      ...reportData.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "warranty_payment_report.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ================================
  // FILTERING AND SEARCH
  // ================================

  const getFilteredPaymentData = () => {
    let allPaymentData = [];

    products.forEach((product) => {
      const schedule = calculateWarrantySchedule(
        product.warrantyStartDate,
        product.cost,
        0.18,
        0.15,
        product.warrantyYears
      );

      Object.entries(schedule).forEach(([quarter, amounts]) => {
        const payment = payments.find(
          (p) => p.productId === product.id && p.quarter === quarter
        );
        const status = getPaymentStatus(product.id, quarter);
        const dueAmount = showGST ? amounts.withGST : amounts.withoutGST;

        allPaymentData.push({
          productId: product.id,
          productName: product.itemName,
          quarter,
          dueAmount,
          status,
          payment,
          location: product.location,
          dueDate: amounts.dueDate,
        });
      });
    });

    // Apply filters
    let filtered = allPaymentData;

    if (paymentFilter !== "all") {
      filtered = filtered.filter((item) => item.status === paymentFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.quarter.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedQuarter) {
      filtered = filtered.filter((item) =>
        item.quarter.includes(selectedQuarter)
      );
    }

    return filtered;
  };

  // Calculate statistics
  const getPaymentStatistics = () => {
    const filteredData = getFilteredPaymentData();
    const totalDue = filteredData.reduce(
      (sum, item) => sum + item.dueAmount,
      0
    );
    const totalPaid = filteredData
      .filter((item) => item.status === "paid")
      .reduce((sum, item) => sum + item.dueAmount, 0);
    const totalOverdue = filteredData
      .filter((item) => item.status === "overdue")
      .reduce((sum, item) => sum + item.dueAmount, 0);
    const totalPending = filteredData
      .filter((item) => item.status === "pending")
      .reduce((sum, item) => sum + item.dueAmount, 0);

    return { totalDue, totalPaid, totalOverdue, totalPending };
  };

  // ================================
  // STYLING SYSTEM
  // ================================

  const containerStyle = {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
    color: "white",
    fontFamily:
      '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: "24px",
  };

  const headerStyle = {
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "32px",
    marginBottom: "40px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
  };

  const titleStyle = {
    fontSize: "2.5rem",
    fontWeight: 800,
    marginBottom: "12px",
    background: "linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    lineHeight: 1.1,
  };

  const subtitleStyle = {
    color: "#cbd5e1",
    fontSize: "1.125rem",
    fontWeight: 500,
    marginBottom: "8px",
  };

  const timeStyle = {
    background: "rgba(255, 255, 255, 0.1)",
    padding: "12px 20px",
    borderRadius: "12px",
    color: "#e2e8f0",
    fontSize: "0.875rem",
    fontWeight: 600,
  };

  const sectionStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#f8fafc",
    color: "#1e293b",
    fontSize: "0.875rem",
    marginBottom: "16px",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontWeight: 600,
    fontSize: "0.875rem",
    color: "#e2e8f0",
  };

  const buttonStyle = (variant = "primary", hovered = false) => ({
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginRight: "8px",
    marginBottom: "8px",
    ...(variant === "primary"
      ? {
          background: hovered
            ? "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)"
            : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          color: "white",
          boxShadow: hovered
            ? "0 12px 25px rgba(59, 130, 246, 0.4)"
            : "0 8px 20px rgba(59, 130, 246, 0.3)",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
        }
      : variant === "danger"
      ? {
          background: "rgba(239, 68, 68, 0.9)",
          color: "white",
          transform: hovered ? "scale(1.05)" : "scale(1)",
        }
      : variant === "success"
      ? {
          background: "rgba(34, 197, 94, 0.9)",
          color: "white",
          transform: hovered ? "scale(1.05)" : "scale(1)",
        }
      : {
          background: "rgba(156, 163, 175, 0.9)",
          color: "white",
          transform: hovered ? "scale(1.05)" : "scale(1)",
        }),
  });

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
  };

  const thStyle = {
    padding: "16px",
    textAlign: "left",
    fontWeight: 600,
    color: "#1e293b",
    backgroundColor: "#f1f5f9",
    borderBottom: "2px solid #e2e8f0",
    fontSize: "0.875rem",
  };

  const tdStyle = {
    padding: "12px 16px",
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "0.875rem",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  };

  const statsStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  };

  const statCardStyle = (color) => ({
    background: `rgba(${color}, 0.1)`,
    border: `1px solid rgba(${color}, 0.3)`,
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  });

  const getStatusBadge = (status) => {
    const badgeStyles = {
      paid: {
        background: "rgba(34, 197, 94, 0.1)",
        color: "#22c55e",
        border: "1px solid rgba(34, 197, 94, 0.3)",
      },
      pending: {
        background: "rgba(249, 115, 22, 0.1)",
        color: "#f97316",
        border: "1px solid rgba(249, 115, 22, 0.3)",
      },
      overdue: {
        background: "rgba(239, 68, 68, 0.1)",
        color: "#ef4444",
        border: "1px solid rgba(239, 68, 68, 0.3)",
      },
    };

    return {
      ...badgeStyles[status],
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "0.75rem",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    };
  };

  const statistics = getPaymentStatistics();

  return (
    <div style={containerStyle}>
      {/* Header Section */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Warranty Paymentr</h1>
          <p style={subtitleStyle}>
            Monitor and manage warranty payment schedules
          </p>
          {hasData && (
            <p
              style={{
                color: "#22c55e",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              ✅ Connected to Excel data: {fileName}
            </p>
          )}
        </div>
        <div style={timeStyle}>IST {currentTime}</div>
      </div>

      {/* Data Source Information */}
      {(hasData || products.length > 0) && (
        <div style={sectionStyle}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              marginBottom: "20px",
              color: "#f1f5f9",
            }}
          >
            📊 Data Sources
          </h2>
          <div style={gridStyle}>
            {hasData && (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "1.2rem",
                    marginBottom: "8px",
                    color: "#22c55e",
                  }}
                >
                  📊
                </div>
                <h4
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    marginBottom: "4px",
                    color: "#22c55e",
                  }}
                >
                  Excel Data from Dashboard
                </h4>
                <p style={{ fontSize: "0.8rem", color: "#f1f5f9", margin: 0 }}>
                  {fileName} - Auto-processed into warranty products
                </p>
              </div>
            )}
            <div
              style={{
                padding: "16px",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "1.2rem",
                  marginBottom: "8px",
                  color: "#3b82f6",
                }}
              >
                🛡️
              </div>
              <h4
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: "4px",
                  color: "#3b82f6",
                }}
              >
                Warranty Products
              </h4>
              <p style={{ fontSize: "0.8rem", color: "#f1f5f9", margin: 0 }}>
                {products.length} products loaded for payment tracking
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Overview */}
      <div style={sectionStyle}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            marginBottom: "20px",
            color: "#f1f5f9",
          }}
        >
          📊 Payment Overview
        </h2>
        <div style={statsStyle}>
          <div style={statCardStyle("59, 130, 246")}>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 800, color: "#3b82f6" }}
            >
              ₹{statistics.totalDue.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#94a3b8",
                marginTop: "4px",
              }}
            >
              Total Due
            </div>
          </div>
          <div style={statCardStyle("34, 197, 94")}>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 800, color: "#22c55e" }}
            >
              ₹{statistics.totalPaid.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#94a3b8",
                marginTop: "4px",
              }}
            >
              Total Paid
            </div>
          </div>
          <div style={statCardStyle("249, 115, 22")}>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f97316" }}
            >
              ₹{statistics.totalPending.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#94a3b8",
                marginTop: "4px",
              }}
            >
              Pending
            </div>
          </div>
          <div style={statCardStyle("239, 68, 68")}>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ef4444" }}
            >
              ₹{statistics.totalOverdue.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#94a3b8",
                marginTop: "4px",
              }}
            >
              Overdue
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Section - Enhanced to show Excel integration */}
      <div style={sectionStyle}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            marginBottom: "20px",
            color: "#f1f5f9",
          }}
        >
          📁 Upload Additional Warranty Data
        </h2>
        <div>
          <label style={labelStyle}>
            Upload CSV or Excel File (Additional to Dashboard Data)
          </label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            style={inputStyle}
            disabled={isProcessing}
          />
          <p
            style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "8px" }}
          >
            Note: Excel files uploaded on the dashboard are automatically
            processed. This is for additional files only. Expected columns: Item
            Name, Cost, Quantity, UAT Date, Location, Warranty Years
          </p>
          {uploadStatus && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                marginTop: "12px",
                fontSize: "0.875rem",
                fontWeight: 500,
                ...(uploadStatus.includes("Error")
                  ? {
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#fca5a5",
                    }
                  : {
                      background: "rgba(34, 197, 94, 0.1)",
                      border: "1px solid rgba(34, 197, 94, 0.3)",
                      color: "#86efac",
                    }),
              }}
            >
              {uploadStatus}
            </div>
          )}
        </div>
        {hasData && (
          <button
            onClick={processExcelDataToProducts}
            style={buttonStyle("primary", hoveredButton === "reprocess")}
            onMouseEnter={() => setHoveredButton("reprocess")}
            onMouseLeave={() => setHoveredButton(null)}
            disabled={isProcessing}
          >
            🔄 Reprocess Excel Data
          </button>
        )}
      </div>

      {/* Filters and Controls */}
      <div style={sectionStyle}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            marginBottom: "20px",
            color: "#f1f5f9",
          }}
        >
          🔍 Filters & Controls
        </h2>
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products, locations, quarters..."
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Payment Status</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Quarter Filter</label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              style={inputStyle}
            >
              <option value="">All Quarters</option>
              <option value="OND">OND (Oct-Dec)</option>
              <option value="JFM">JFM (Jan-Mar)</option>
              <option value="AMJ">AMJ (Apr-Jun)</option>
              <option value="JAS">JAS (Jul-Sep)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Display Amounts</label>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#e2e8f0",
                  fontSize: "0.875rem",
                }}
              >
                <input
                  type="radio"
                  checked={showGST}
                  onChange={() => setShowGST(true)}
                />
                With GST (18%)
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#e2e8f0",
                  fontSize: "0.875rem",
                }}
              >
                <input
                  type="radio"
                  checked={!showGST}
                  onChange={() => setShowGST(false)}
                />
                Without GST
              </label>
            </div>
          </div>
        </div>
        <button
          onClick={exportPaymentReport}
          style={buttonStyle("primary", hoveredButton === "export")}
          onMouseEnter={() => setHoveredButton("export")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          📄 Export Report
        </button>
      </div>

      {/* Add Payment Form */}
      {products.length > 0 && (
        <div style={sectionStyle}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              marginBottom: "20px",
              color: "#f1f5f9",
            }}
          >
            💳 Record Payment
          </h2>
          <form onSubmit={handlePaymentSubmit}>
            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>Select Product</label>
                <select
                  value={paymentForm.productId}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      productId: e.target.value,
                    })
                  }
                  style={inputStyle}
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.itemName} - {product.location}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Quarter</label>
                <select
                  value={paymentForm.quarter}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, quarter: e.target.value })
                  }
                  style={inputStyle}
                  required
                >
                  <option value="">Select quarter</option>
                  {paymentForm.productId &&
                    (() => {
                      const product = products.find(
                        (p) => p.id === paymentForm.productId
                      );
                      if (product) {
                        const schedule = calculateWarrantySchedule(
                          product.warrantyStartDate,
                          product.cost,
                          0.18,
                          0.15,
                          product.warrantyYears
                        );
                        return Object.keys(schedule).map((quarter) => (
                          <option key={quarter} value={quarter}>
                            {quarter} - ₹
                            {(showGST
                              ? schedule[quarter].withGST
                              : schedule[quarter].withoutGST
                            ).toFixed(2)}
                          </option>
                        ));
                      }
                      return null;
                    })()}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Payment Amount (₹)</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                  placeholder="0.00"
                  step="0.01"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Payment Date</label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentDate: e.target.value,
                    })
                  }
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Payment Mode</label>
                <select
                  value={paymentForm.paymentMode}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentMode: e.target.value,
                    })
                  }
                  style={inputStyle}
                >
                  <option value="online">Online Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="dd">Demand Draft</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Transaction ID</label>
                <input
                  type="text"
                  value={paymentForm.transactionId}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      transactionId: e.target.value,
                    })
                  }
                  placeholder="Enter transaction/reference ID"
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Remarks</label>
                <input
                  type="text"
                  value={paymentForm.remarks}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, remarks: e.target.value })
                  }
                  placeholder="Additional notes or remarks"
                  style={inputStyle}
                />
              </div>
            </div>
            <button
              type="submit"
              style={buttonStyle("success", hoveredButton === "addPayment")}
              onMouseEnter={() => setHoveredButton("addPayment")}
              onMouseLeave={() => setHoveredButton(null)}
            >
              💾 Record Payment
            </button>
          </form>
        </div>
      )}

      {/* Payment Schedule Table */}
      {products.length > 0 && (
        <div style={sectionStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#f1f5f9",
                margin: 0,
              }}
            >
              💰 Payment Schedule ({getFilteredPaymentData().length} entries)
            </h2>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Product Name</th>
                  <th style={thStyle}>Quarter</th>
                  <th style={thStyle}>Due Amount</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Due Date</th>
                  <th style={thStyle}>Payment Date</th>
                  <th style={thStyle}>Transaction ID</th>
                  <th style={thStyle}>Payment Mode</th>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredPaymentData().map((item, index) => (
                  <tr key={`${item.productId}-${item.quarter}-${index}`}>
                    <td style={tdStyle}>{item.productName}</td>
                    <td style={tdStyle}>{item.quarter}</td>
                    <td style={tdStyle}>₹{item.dueAmount.toFixed(2)}</td>
                    <td style={tdStyle}>
                      <span style={getStatusBadge(item.status)}>
                        {item.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td style={tdStyle}>
                      {item.payment
                        ? new Date(item.payment.paymentDate).toLocaleDateString(
                            "en-GB"
                          )
                        : "-"}
                    </td>
                    <td style={tdStyle}>
                      {item.payment ? item.payment.transactionId || "-" : "-"}
                    </td>
                    <td style={tdStyle}>
                      {item.payment ? item.payment.paymentMode : "-"}
                    </td>
                    <td style={tdStyle}>{item.location}</td>
                    <td style={tdStyle}>
                      {item.payment && (
                        <button
                          onClick={() => removePayment(item.payment.id)}
                          style={buttonStyle(
                            "danger",
                            hoveredButton === `remove-${item.payment.id}`
                          )}
                          onMouseEnter={() =>
                            setHoveredButton(`remove-${item.payment.id}`)
                          }
                          onMouseLeave={() => setHoveredButton(null)}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {getFilteredPaymentData().length === 0 && (
                  <tr>
                    <td
                      colSpan="10"
                      style={{
                        ...tdStyle,
                        textAlign: "center",
                        color: "#94a3b8",
                        fontStyle: "italic",
                      }}
                    >
                      No payment records found matching the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div style={sectionStyle}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              marginBottom: "20px",
              color: "#f1f5f9",
            }}
          >
            📋 Recent Payments ({payments.length})
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Quarter</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Mode</th>
                  <th style={thStyle}>Transaction ID</th>
                  <th style={thStyle}>Remarks</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map((payment) => (
                    <tr key={payment.id}>
                      <td style={tdStyle}>
                        {new Date(payment.paymentDate).toLocaleDateString(
                          "en-GB"
                        )}
                      </td>
                      <td style={tdStyle}>{payment.productName}</td>
                      <td style={tdStyle}>{payment.quarter}</td>
                      <td style={tdStyle}>₹{payment.amount.toFixed(2)}</td>
                      <td style={tdStyle}>{payment.paymentMode}</td>
                      <td style={tdStyle}>{payment.transactionId || "-"}</td>
                      <td style={tdStyle}>{payment.remarks || "-"}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => removePayment(payment.id)}
                          style={buttonStyle(
                            "danger",
                            hoveredButton === `remove-payment-${payment.id}`
                          )}
                          onMouseEnter={() =>
                            setHoveredButton(`remove-payment-${payment.id}`)
                          }
                          onMouseLeave={() => setHoveredButton(null)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {products.length === 0 && (
        <div style={sectionStyle}>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <h3 style={{ color: "#94a3b8", marginBottom: "16px" }}>
              No warranty products loaded
            </h3>
            <p style={{ color: "#64748b", marginBottom: "16px" }}>
              {hasData
                ? "Excel data detected on dashboard. Processing will happen automatically, or you can trigger it manually."
                : "Upload an Excel file on the dashboard or upload a warranty data file here to start tracking payments."}
            </p>
            {hasData && (
              <button
                onClick={processExcelDataToProducts}
                style={buttonStyle("primary", hoveredButton === "processExcel")}
                onMouseEnter={() => setHoveredButton("processExcel")}
                onMouseLeave={() => setHoveredButton(null)}
                disabled={isProcessing}
              >
                🔄 Process Excel Data Now
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ================================
// MAIN APP WRAPPER WITH PROVIDERS
// ================================
function App() {
  return (
    <ExcelProvider>
      <WarrantyDataProvider>
        <WarrantyPaymentTracker />
      </WarrantyDataProvider>
    </ExcelProvider>
  );
}

export default App;
