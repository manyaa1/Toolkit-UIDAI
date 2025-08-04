
import { createSlice } from '@reduxjs/toolkit';

// Load initial state from localStorage
const loadFromLocalStorage = () => {
  try {
    const serializedState = localStorage.getItem('paymentTracker');
    if (serializedState === null) {
      return {
        payments: [],
        filters: {
          search: "",
          status: "all",
          recipient: "all",
          category: "all",
          quarter: "all",
          location: "all"
        },
        selectedRecords: [],
        viewMode: 'table',
        sortConfig: { key: '', direction: 'asc' },
        showNotifications: false,
        currentTime: "",
        isMobile: false,
        hoveredCard: null,
        activeIndex: 0,
        analytics: {
          summary: {
            total: 0,
            approved: 0,
            pending: 0,
            overdue: 0,
            processing: 0,
            paid: 0,
            urgent: 0
          },
          vendors: 0,
          categories: 0,
          quarters: 0,
          locations: 0,
          totalRecords: 0
        }
      };
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error('Error loading from localStorage:', err);
    return {
      payments: [],
      filters: {
        search: "",
        status: "all",
        recipient: "all",
        category: "all",
        quarter: "all",
        location: "all"
      },
      selectedRecords: [],
      viewMode: 'table',
      sortConfig: { key: '', direction: 'asc' },
      showNotifications: false,
      currentTime: "",
      isMobile: false,
      hoveredCard: null,
      analytics: {
        summary: {
          total: 0,
          approved: 0,
          pending: 0,
          overdue: 0,
          processing: 0,
          paid: 0,
          urgent: 0
        },
        vendors: 0,
        categories: 0,
        quarters: 0,
        locations: 0,
        totalRecords: 0
      }
    };
  }
};

// Save to localStorage
const saveToLocalStorage = (state) => {
  try {
    const serializedState = JSON.stringify({
      payments: state.payments,
      filters: state.filters,
      selectedRecords: state.selectedRecords,
      viewMode: state.viewMode,
      sortConfig: state.sortConfig,
      analytics: state.analytics
    });
    localStorage.setItem('paymentTracker', serializedState);
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
};

// Utility functions
const getQuarterEndDate = (quarter) => {
  if (!quarter || !quarter.includes('-')) return null;
  
  const [quarterCode, year] = quarter.split('-');
  const quarterEndDates = {
    'JFM': `${year}-04-04`,
    'AMJ': `${year}-07-04`,
    'JAS': `${year}-10-04`,
    'OND': `${parseInt(year) + 1}-01-04`
  };
  
  return quarterEndDates[quarterCode] || null;
};

const getStatusFromDueDate = (dueDate) => {
  if (!dueDate) return 'pending';
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'urgent';
  return 'pending';
};

const calculateAnalytics = (payments) => {
  if (payments.length === 0) {
    return {
      summary: {
        total: 0,
        approved: 0,
        pending: 0,
        overdue: 0,
        processing: 0,
        paid: 0,
        urgent: 0
      },
      vendors: 0,
      categories: 0,
      quarters: 0,
      locations: 0,
      totalRecords: 0
    };
  }

  const summary = payments.reduce((acc, record) => {
    const amount = parseFloat(record.amount) || 0;
    acc.total += amount;
    
    const dueDate = getQuarterEndDate(record.quarter);
    const actualStatus = record.status === 'pending' ? getStatusFromDueDate(dueDate) : record.status;
    switch (actualStatus) {
      case 'approved': acc.approved += amount; break;
      case 'pending': acc.pending += amount; break;
      case 'urgent': acc.urgent += amount; break;
      case 'overdue': acc.overdue += amount; break;
      case 'processing': acc.processing += amount; break;
      case 'paid': acc.paid += amount; break;
      default:break; 
    }
    return acc;
  }, { total: 0, approved: 0, pending: 0, overdue: 0, processing: 0, paid: 0, urgent: 0 });

  const vendors = new Set(payments.map(r => r.recipient).filter(Boolean)).size;
  const categories = new Set(payments.map(r => r.category).filter(Boolean)).size;
  const quarters = new Set(payments.map(r => r.quarter).filter(Boolean)).size;
  const locations = new Set(payments.map(r => r.location).filter(Boolean)).size;

  return {
    summary,
    vendors,
    categories,
    quarters,
    locations,
    totalRecords: payments.length
  };
};

const initialState = loadFromLocalStorage();

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    addPayment: (state, action) => {
      const payment = {
        ...action.payload,
        id: Date.now().toString(),
        amount: parseFloat(action.payload.amount),
        isPaid: false,
        createdAt: new Date().toISOString()
      };
      state.payments.push(payment);
      state.analytics = calculateAnalytics(state.payments);
      saveToLocalStorage(state);
    },
    
    addMultiplePayments: (state, action) => {
      state.payments = [...state.payments, ...action.payload];
      state.analytics = calculateAnalytics(state.payments);
      saveToLocalStorage(state);
    },
    
    togglePaymentStatus: (state, action) => {
      const payment = state.payments.find(p => p.id === action.payload);
      if (payment) {
        payment.isPaid = !payment.isPaid;
        payment.paidAt = payment.isPaid ? new Date().toISOString() : null;
        payment.status = payment.isPaid ? 'paid' : 'pending';
        if (payment.isPaid) {
          payment.paidDate = new Date().toISOString();
        }
      }
      state.analytics = calculateAnalytics(state.payments);
      saveToLocalStorage(state);
    },
    
    markPaymentPaid: (state, action) => {
      const payment = state.payments.find(p => p.id === action.payload);
      if (payment) {
        payment.status = 'paid';
        payment.isPaid = true;
        payment.paidDate = new Date().toISOString();
        payment.paidAt = new Date().toISOString();
      }
      state.analytics = calculateAnalytics(state.payments);
      saveToLocalStorage(state);
    },
    
    deletePayment: (state, action) => {
      state.payments = state.payments.filter(p => p.id !== action.payload);
      state.analytics = calculateAnalytics(state.payments);
      saveToLocalStorage(state);
    },
    
    updatePayment: (state, action) => {
      const { id, updates } = action.payload;
      const payment = state.payments.find(p => p.id === id);
      if (payment) {
        Object.assign(payment, updates);
        payment.lastModified = new Date().toISOString();
      }
      state.analytics = calculateAnalytics(state.payments);
      saveToLocalStorage(state);
    },
    
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      saveToLocalStorage(state);
    },
    
    resetFilters: (state) => {
      state.filters = {
        search: "",
        status: "all",
        recipient: "all",
        category: "all",
        quarter: "all",
        location: "all"
      };
      saveToLocalStorage(state);
    },
    
    setSelectedRecords: (state, action) => {
      state.selectedRecords = action.payload;
    },
    
    toggleRecordSelection: (state, action) => {
      const recordId = action.payload;
      const exists = state.selectedRecords.find(r => r.id === recordId);
      if (exists) {
        state.selectedRecords = state.selectedRecords.filter(r => r.id !== recordId);
      } else {
        const record = state.payments.find(p => p.id === recordId);
        if (record) {
          state.selectedRecords.push(record);
        }
      }
    },
    
    clearSelection: (state) => {
      state.selectedRecords = [];
    },
    
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
      saveToLocalStorage(state);
    },
    
    setSortConfig: (state, action) => {
      state.sortConfig = action.payload;
      saveToLocalStorage(state);
    },
    
    setShowNotifications: (state, action) => {
      state.showNotifications = action.payload;
    },
    
    setCurrentTime: (state, action) => {
      state.currentTime = action.payload;
    },
    
    setIsMobile: (state, action) => {
      state.isMobile = action.payload;
    },
    
    setHoveredCard: (state, action) => {
      state.hoveredCard = action.payload;
    },
    
    clearAllData: (state) => {
      state.payments = [];
      state.selectedRecords = [];
      state.analytics = calculateAnalytics([]);
      localStorage.removeItem('paymentTracker');
    },
    
    importPayments: (state, action) => {
      const importedPayments = action.payload;
      state.payments = [...state.payments, ...importedPayments];
      state.analytics = calculateAnalytics(state.payments);
      saveToLocalStorage(state);
    },
    
    bulkUpdateStatus: (state, action) => {
      const { recordIds, status } = action.payload;
      recordIds.forEach(id => {
        const payment = state.payments.find(p => p.id === id);
        if (payment) {
          payment.status = status;
          if (status === 'paid') {
            payment.isPaid = true;
            payment.paidDate = new Date().toISOString();
            payment.paidAt = new Date().toISOString();
          } else {
            payment.isPaid = false;
            payment.paidDate = null;
            payment.paidAt = null;
          }
        }
      });
      state.analytics = calculateAnalytics(state.payments);
      saveToLocalStorage(state);
    }
  }
});

export const {
  addPayment,
  addMultiplePayments,
  togglePaymentStatus,
  markPaymentPaid,
  deletePayment,
  updatePayment,
  setFilters,
  resetFilters,
  setSelectedRecords,
  toggleRecordSelection,
  clearSelection,
  setViewMode,
  setSortConfig,
  setShowNotifications,
  setCurrentTime,
  setIsMobile,
  setHoveredCard,
  clearAllData,
  importPayments,
  bulkUpdateStatus
} = paymentSlice.actions;

export default paymentSlice.reducer;
