// src/store/amcScheduleSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Initial state for AMC Schedule management
const initialState = {
  uploadedFile: null,
  calculatedData: null,
  loading: false,
  error: null,
  settings: {
    gstRate: 0.18,           // GST rate (18%)
    amcPercentage: 0.40,     // AMC percentage (40% of cost)
    roiRates: [20, 22.5, 27.5, 30] // Year-wise ROI rates
  }
};
const amcScheduleSlice = createSlice({
  name: 'amcSchedule',
  initialState,
  reducers: {
    setUploadedFile: (state, action) => {
      state.uploadedFile = action.payload;
      state.error = null;
    },

    setCalculatedData: (state, action) => {
      state.calculatedData = action.payload;
    },

    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },

    clearData: (state) => {
      state.uploadedFile = null;
      state.calculatedData = null;
      state.error = null;
    },
    updateAmcPaymentStatus: (state, action) => {
    const { productId, quarterKey, newStatus } = action.payload;

    if (!state.calculatedData) return;

      // Find the product by ID
    const product = state.calculatedData.products.find(p => p.id === productId);
    if (!product || !product.quarters) return;

      // Update the payment status for the specific quarter
    if (product.quarters[quarterKey]) {
        product.quarters[quarterKey].paid = newStatus;
    }
    },

    loadAMCFromMemory: (state, action) => {
      const stored = JSON.parse(localStorage.getItem('amcData'));
      if (stored) {
        state.calculatedData = stored.calculatedData;
        state.uploadedFile = stored.uploadedFile;
        state.settings = stored.settings;
      }
    }
  }
});

// Exporting actions
export const { 
  setUploadedFile, 
  setCalculatedData, 
  updateSettings,
  setLoading, 
  setError, 
  clearData ,
  loadAMCFromMemory,
  updateAmcPaymentStatus
} = amcScheduleSlice.actions;

// Exporting reducer
export default amcScheduleSlice.reducer;
