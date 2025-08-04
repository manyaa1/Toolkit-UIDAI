//dashboard-redux.js
import React, { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import * as XLSX from 'xlsx';

// Redux Actions
import { 
  processExcelFile, 
  loadExcelFromMemory, 
  setActiveSheet, 
  clearData as clearExcelData 
} from '../store/slice/excelSlice';

import { 
  storeAMCCalculations, 
  loadAMCFromMemory, 
  clearData 
} from '../store/slice/amcScheduleSlice';

import { 
  storeWarrantyCalculations, 
  loadWarrantyFromMemory,
  clearWarrantyData 
} from '../store/slice/warrantyDataSlice';

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
} from '../store/slice/dashboardSlice';

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
  selectSheetData
} from '../store/selectors/excelSelectors';

import {
  selectAMCCalculations,
  selectAMCMetadata,
  selectAMCHistory,
  selectAMCIsProcessing,
  selectHasAMCData,
  selectTotalAMCAssets,
  selectTotalAMCValue,
  selectAMCCalculationsForPayments
} from '../store/selectors/amcDataSelectors';

import {
  selectWarrantyCalculations,
  selectWarrantyMetadata,
  selectWarrantyHistory,
  selectWarrantyIsProcessing,
  selectHasWarrantyData,
  selectTotalWarrantyAssets,
  selectTotalWarrantyValue,
  selectWarrantyCalculationsForPayments
} from '../store/selectors/warrantyDataSelectors';

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
  selectFilteredTools
} from '../store/selectors/dashboardSelectors';

// ================================
// COMPREHENSIVE STYLING DEFINITIONS
// ================================

const styles = {
  // Base container styles
  container: (isDarkMode, isMobile) => ({
    minHeight: '100vh',
    background: isDarkMode 
      ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    color: isDarkMode ? 'white' : '#1e293b',
    fontFamily: '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    position: 'relative',
    transition: 'all 0.3s ease',
  }),

  // Background overlay
  backgroundOverlay: (isDarkMode) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: isDarkMode ? `
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)
    ` : `
      radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)
    `,
    pointerEvents: 'none',
  }),

  // Sidebar styles
  sidebar: (isDarkMode, isMobile) => ({
    width: isMobile ? '100%' : '300px',
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(20px)',
    borderRight: `1px solid ${isDarkMode ? 'rgba(203, 213, 225, 0.3)' : 'rgba(203, 213, 225, 0.5)'}`,
    color: '#1e293b',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 10,
    minHeight: isMobile ? 'auto' : '100vh',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  }),

  // Header section
  headerSection: {
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '24px',
    marginBottom: '32px',
  },

  // Main header
  mainHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },

  // Title
  title: {
    fontSize: '1.75rem',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },

  // Time display
  time: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: 600,
  },

  // Subtitle
  subtitle: {
    color: '#64748b',
    fontSize: '0.95rem',
    margin: 0,
    lineHeight: 1.5,
  },

  // Quick stats container
  quickStats: {
    marginBottom: '32px'
  },

  quickStatsTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#374151',
    marginBottom: '16px',
  },

  quickStatsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },

  statCard: (color) => ({
    padding: '12px',
    backgroundColor: `rgba(${color}, 0.1)`,
    borderRadius: '12px',
    textAlign: 'center',
  }),

  statValue: (color) => ({
    fontSize: '1.25rem',
    fontWeight: 700,
    color: color,
  }),

  statLabel: {
    fontSize: '0.75rem',
    color: '#64748b'
  },

  // Quick tips
  quickTips: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '32px',
    border: '1px solid rgba(139, 92, 246, 0.2)',
  },

  quickTipsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },

  quickTipsTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#6d28d9',
    margin: 0,
  },

  closeButton: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '1.2rem',
  },

  quickTipsText: {
    fontSize: '0.85rem',
    color: '#4c1d95',
    lineHeight: 1.5,
    margin: 0,
  },

  // Controls
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  controlButton: (isHovered, bgColor, textColor, hoverBg, hoverText) => ({
    padding: '12px 16px',
    backgroundColor: isHovered ? hoverBg : bgColor,
    color: isHovered ? hoverText : textColor,
    border: `1px solid ${textColor}33`,
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    position: 'relative',
  }),

  notificationBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    fontSize: '0.7rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer
  footer: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: '20px',
    marginTop: '20px',
  },

  footerControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },

  themeLabel: {
    fontSize: '0.8rem',
    color: '#64748b'
  },

  themeButton: (isDarkMode) => ({
    padding: '6px 12px',
    backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
    color: isDarkMode ? '#d1d5db' : '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }),

  version: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    textAlign: 'center',
  },

  // Main content
  mainContent: (isMobile) => ({
    flex: 1,
    padding: isMobile ? '20px' : '40px',
    overflowY: 'auto',
    position: 'relative',
    zIndex: 1,
  }),

  // Excel Upload Section
  uploadSection: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '32px',
    marginBottom: '40px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15)',
  },

  uploadHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px'
  },

  uploadTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '8px'
  },

  uploadSubtitle: {
    color: '#64748b',
    fontSize: '0.95rem',
    margin: 0
  },

  clearButton: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  // Data status grid
  dataStatusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },

  dataStatusCard: (hasData, color) => ({
    padding: '16px',
    backgroundColor: hasData ? color.bg : '#f8fafc',
    border: `1px solid ${hasData ? color.border : '#e2e8f0'}`,
    borderRadius: '12px'
  }),

  dataStatusIcon: {
    fontSize: '1.5rem',
    marginBottom: '8px'
  },

  dataStatusTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    marginBottom: '4px',
    color: '#1e293b'
  },

  dataStatusText: {
    fontSize: '0.8rem',
    color: '#64748b',
    margin: 0
  },

  dataStatusDebug: {
    fontSize: '0.7rem',
    color: '#9ca3af',
    margin: '4px 0 0 0'
  },

  // Upload area
  uploadArea: (dragActive, isLoading, hasData) => ({
    border: `2px dashed ${dragActive ? '#3b82f6' : '#cbd5e1'}`,
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
    backgroundColor: dragActive ? '#f0f9ff' : hasData ? '#f0fdf4' : '#f8fafc',
    transition: 'all 0.3s ease',
    position: 'relative'
  }),

  uploadIcon: {
    fontSize: '2rem',
    marginBottom: '16px'
  },

  uploadMessage: (color, weight = 600) => ({
    color: color,
    fontWeight: weight,
    marginBottom: '8px'
  }),

  uploadStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },

  uploadStatCard: {
    backgroundColor: 'white',
    padding: '12px 20px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },

  uploadStatValue: (color) => ({
    fontSize: '1.25rem',
    fontWeight: 700,
    color: color
  }),

  uploadStatLabel: {
    fontSize: '0.8rem',
    color: '#64748b'
  },

  uploadButton: (primary = false) => ({
    padding: primary ? '12px 24px' : '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: primary ? '8px' : '6px',
    cursor: 'pointer',
    fontSize: primary ? '0.9rem' : '0.875rem',
    fontWeight: 600,
    transition: 'all 0.2s ease'
  }),

  hiddenInput: {
    display: 'none'
  },

  errorMessage: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '0.875rem'
  },

  // Debug panel
  debugDetails: {
    marginTop: '16px'
  },

  debugSummary: {
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#64748b',
    padding: '8px 0'
  },

  debugContent: {
    padding: '12px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    color: '#374151'
  },

  // Data flow info
  dataFlowInfo: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bfdbfe',
    borderRadius: '12px'
  },

  dataFlowTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#1e293b'
  },

  dataFlowList: {
    fontSize: '0.8rem',
    color: '#64748b',
    lineHeight: 1.6
  },

  dataFlowItem: {
    margin: '4px 0'
  },

  // Category filters
  categoryFilters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
    flexWrap: 'wrap',
  },

  categoryFilter: (isActive) => ({
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.8)',
    color: isActive ? 'white' : '#64748b',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
  }),

  // Tools grid
  toolsGrid: (isMobile) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '32px',
    marginBottom: '40px',
  }),

  // Tool card
  toolCard: (isHovered) => ({
    background: isHovered 
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)'
      : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '32px',
    border: `1px solid ${isHovered ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`,
    boxShadow: isHovered 
      ? '0 25px 50px -12px rgba(59, 130, 246, 0.25)'
      : '0 20px 40px -12px rgba(0, 0, 0, 0.15)',
    transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  }),

  toolIcon: {
    fontSize: '3rem',
    marginBottom: '20px',
    display: 'block',
  },

  toolTag: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginBottom: '16px',
  },

  toolTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '12px',
    lineHeight: 1.2,
  },

  toolDescription: {
    color: '#64748b',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    marginBottom: '20px',
  },

  statusIndicator: (status) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 500,
    backgroundColor: status === 'ready' ? '#f0fdf4' : '#fef3c7',
    color: status === 'ready' ? '#059669' : '#d97706',
    border: `1px solid ${status === 'ready' ? '#bbf7d0' : '#fcd34d'}`,
  }),

  statusDot: (status) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: status === 'ready' ? '#10b981' : '#f59e0b',
  }),

  hoverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
    borderRadius: '20px',
    pointerEvents: 'none',
  },

  // Search modal
  searchModal: (showSearch) => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: showSearch ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  }),

  searchBox: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },

  searchInput: {
    width: '100%',
    padding: '16px',
    fontSize: '1.1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    outline: 'none',
    marginBottom: '16px',
  },

  searchHint: {
    fontSize: '0.875rem',
    color: '#64748b'
  },

  // Notification panel
  notificationPanel: (showNotifications) => ({
    position: 'absolute',
    top: '70px',
    right: '20px',
    width: '320px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
    padding: '20px',
    zIndex: 100,
    display: showNotifications ? 'block' : 'none',
    maxHeight: '400px',
    overflowY: 'auto',
  }),

  notificationTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    marginBottom: '16px',
    color: '#1e293b',
  },

  noNotifications: {
    color: '#64748b',
    fontSize: '0.875rem'
  },

  notificationItem: (type) => ({
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '8px',
    borderLeft: `4px solid ${type === 'warning' ? '#f59e0b' : '#3b82f6'}`,
  }),

  notificationItemTitle: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '4px',
  },

  notificationItemMessage: {
    fontSize: '0.75rem',
    color: '#64748b',
  },

  // Recent activity
  recentActivity: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15)',
  },

  recentActivityTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '24px',
  },

  activityList: {
    gap: '16px'
  },

  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    marginBottom: '12px',
  },

  activityIcon: {
    fontSize: '1.5rem'
  },

  activityContent: {
    flex: 1
  },

  activityTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '4px',
  },

  activityTimestamp: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
};

// ================================
// EXCEL UPLOAD SECTION COMPONENT
// ================================
const ExcelUploadSection = () => {
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

  const handleFile = useCallback(async (file) => {
    if (!file) {
      console.error('❌ No file provided to handleFile');
      return;
    }
    
    console.log('📁 File received:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '.xlsx',
      '.xls'
    ];
    
    const isValidType = validTypes.some(type => 
      file.type === type || file.name.toLowerCase().endsWith(type)
    );
    
    if (!isValidType) {
      console.error('❌ Invalid file type:', file.type);
      alert('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }
    
    console.log('✅ File type validation passed');
    console.log('🚀 Dispatching processExcelFile action...');
    
    try {
      const result = await dispatch(processExcelFile(file));
      console.log('📊 processExcelFile result:', result);
      
      if (result.type && result.type.endsWith('/fulfilled')) {
        console.log('🎉 FILE UPLOADED SUCCESSFULLY! 🎉');
        console.log('📈 Excel data processed and stored in Redux store');
        alert('✅ File uploaded successfully!');
      } else if (result.type && result.type.endsWith('/rejected')) {
        console.error('❌ File upload failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error during file processing:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    console.log('📊 Excel state updated:', {
      hasData,
      fileName,
      sheetsCount: sheets?.length || 0,
      totalRows,
      isLoading,
      error
    });
    
    if (hasData && fileName) {
      console.log('🎯 Excel data is now available in Redux store!');
      console.log('📋 Available sheets:', sheets.map(sheet => sheet.name));
    }
  }, [hasData, fileName, sheets, totalRows, isLoading, error]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('📁 Drag event:', e.type);
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    console.log('📁 File dropped!');
    console.log('📁 Files in drop:', e.dataTransfer.files.length);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      console.log('📁 Processing dropped file...');
      handleFile(e.dataTransfer.files[0]);
    } else {
      console.error('❌ No files found in drop event');
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e) => {
    console.log('📁 File input changed');
    console.log('📁 Files selected:', e.target.files?.length || 0);
    
    if (e.target.files && e.target.files[0]) {
      console.log('📁 Processing selected file...');
      handleFile(e.target.files[0]);
    } else {
      console.error('❌ No files found in file input');
    }
  }, [handleFile]);

  const handleClearAllData = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all data? This will remove Excel files, AMC calculations, and Warranty calculations.')) {
      console.log('🗑️ Clearing all data...');
      dispatch(clearExcelData());
      dispatch(clearData());
      dispatch(clearWarrantyData());
      console.log('✅ All data cleared');
    }
  }, [dispatch]);

  useEffect(() => {
    console.log('🔍 Current Redux Excel State Debug:', {
      excelData: excelData ? 'Present' : 'Missing',
      fileName: fileName || 'No filename',
      sheets: sheets?.length || 0,
      hasData,
      isLoading,
      error: error || 'No error',
      totalRows
    });
  }, [excelData, fileName, sheets, hasData, isLoading, error, totalRows]);

  return (
    <div style={styles.uploadSection}>
      <div style={styles.uploadHeader}>
        <div>
          <h3 style={styles.uploadTitle}>
            📊 Global Data Management Hub
          </h3>
          <p style={styles.uploadSubtitle}>
            Centralized data storage for Excel files, AMC calculations, and Warranty calculations
          </p>
        </div>
        {(hasData || hasAMCData || hasWarrantyData) && (
          <button onClick={handleClearAllData} style={styles.clearButton}>
            Clear All Data
          </button>
        )}
      </div>

      {/* Data Status Grid */}
      <div style={styles.dataStatusGrid}>
        {/* Excel Data Status */}
        <div style={styles.dataStatusCard(hasData, { bg: '#f0fdf4', border: '#bbf7d0' })}>
          <div style={styles.dataStatusIcon}>
            {hasData ? '📊' : '📄'}
          </div>
          <h4 style={styles.dataStatusTitle}>Excel Files</h4>
          <p style={styles.dataStatusText}>
            {hasData ? `${sheets.length} sheets, ${totalRows.toLocaleString()} rows` : 'No files uploaded'}
          </p>
          <p style={styles.dataStatusDebug}>
            Debug: {isLoading ? 'Loading...' : hasData ? 'Data loaded' : 'No data'}
          </p>
        </div>

        {/* AMC Data Status */}
        <div style={styles.dataStatusCard(hasAMCData, { bg: '#eff6ff', border: '#bfdbfe' })}>
          <div style={styles.dataStatusIcon}>
            {hasAMCData ? '🔧' : '⚙️'}
          </div>
          <h4 style={styles.dataStatusTitle}>AMC Calculations</h4>
          <p style={styles.dataStatusText}>
            {hasAMCData ? `${totalAMCAssets} assets, ₹${totalAMCValue.toLocaleString()}` : 'No calculations stored'}
          </p>
        </div>

        {/* Warranty Data Status */}
        <div style={styles.dataStatusCard(hasWarrantyData, { bg: '#fef3c7', border: '#fcd34d' })}>
          <div style={styles.dataStatusIcon}>
            {hasWarrantyData ? '🛡️' : '🔒'}
          </div>
          <h4 style={styles.dataStatusTitle}>Warranty Calculations</h4>
          <p style={styles.dataStatusText}>
            {hasWarrantyData ? `${totalWarrantyAssets} assets, ₹${totalWarrantyValue.toLocaleString()}` : 'No calculations stored'}
          </p>
        </div>
      </div>

      {/* Excel Upload Area */}
      <div
        style={styles.uploadArea(dragActive, isLoading, hasData)}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div>
            <div style={styles.uploadIcon}>⏳</div>
            <p style={styles.uploadMessage('#3b82f6')}>Processing Excel file...</p>
            <p style={styles.uploadMessage('#64748b', 400)}>Please wait while we process your file</p>
          </div>
        ) : hasData ? (
          <div>
            <div style={styles.uploadIcon}>✅</div>
            <p style={styles.uploadMessage('#059669')}>Excel File Loaded Successfully</p>
            <p style={styles.uploadMessage('#6b7280', 400)}>{fileName}</p>
            
            <div style={styles.uploadStats}>
              <div style={styles.uploadStatCard}>
                <div style={styles.uploadStatValue('#3b82f6')}>{sheets.length}</div>
                <div style={styles.uploadStatLabel}>Sheets</div>
              </div>
              <div style={styles.uploadStatCard}>
                <div style={styles.uploadStatValue('#059669')}>{totalRows.toLocaleString()}</div>
                <div style={styles.uploadStatLabel}>Total Rows</div>
              </div>
            </div>
            
            <button
              onClick={() => {
                console.log('📁 User clicked to upload different file');
                document.getElementById('excel-file-input').click();
              }}
              style={styles.uploadButton()}
            >
              Upload Different File
            </button>
          </div>
        ) : (
          <div>
            <div style={styles.uploadIcon}>📊</div>
            <p style={styles.uploadMessage('#374151')}>Upload Excel File</p>
            <p style={styles.uploadMessage('#6b7280', 400)}>
              Drag and drop your Excel file here, or click to browse
            </p>
            <button
              onClick={() => {
                console.log('📁 User clicked to choose file');
                document.getElementById('excel-file-input').click();
              }}
              style={styles.uploadButton(true)}
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
          style={styles.hiddenInput}
        />
      </div>
      
      {error && (
        <div style={styles.errorMessage}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Debug Information Panel */}
      <details style={styles.debugDetails}>
        <summary style={styles.debugSummary}>
          🔍 Debug Information (Click to expand)
        </summary>
        <div style={styles.debugContent}>
          <pre>{JSON.stringify({
            hasData,
            fileName: fileName || 'null',
            sheetsCount: sheets?.length || 0,
            totalRows,
            isLoading,
            error: error || 'null',
            excelDataPresent: excelData ? 'yes' : 'no',
            timestamp: new Date().toISOString()
          }, null, 2)}</pre>
        </div>
      </details>

      {/* Data Flow Information */}
      {(hasData || hasAMCData || hasWarrantyData) && (
        <div style={styles.dataFlowInfo}>
          <h4 style={styles.dataFlowTitle}>🔄 Data Flow Status</h4>
          <div style={styles.dataFlowList}>
            <p style={styles.dataFlowItem}>
              • <strong>Excel Files:</strong> {hasData ? 'Available for AMC/Warranty calculations' : 'Upload required'}
            </p>
            <p style={styles.dataFlowItem}>
              • <strong>AMC Calculations:</strong> {hasAMCData ? 'Ready for Payment Tracker' : 'Run AMC Calculator first'}
            </p>
            <p style={styles.dataFlowItem}>
              • <strong>Warranty Calculations:</strong> {hasWarrantyData ? 'Ready for Payment Tracker' : 'Run Warranty Calculator first'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ================================
// MAIN DASHBOARD COMPONENT
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

  const quickTips = [
    "Use the search feature to quickly find specific tools and features",
    "Export your calculations directly to Excel from any tool",
    "Set up notifications for important payment deadlines",
    "Use keyboard shortcuts: Ctrl+K for search, Ctrl+D for dashboard",
    "AMC calculations are automatically saved and available in Payment Tracker",
    "Upload Excel files once to use across all calculation tools"
  ];

  useEffect(() => {
    const savedExcel = localStorage.getItem('excelData');
    const savedAMC = localStorage.getItem('amcData');
    const savedWarranty = localStorage.getItem('warrantyData');

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
      const time = new Date().toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
      });
      dispatch(setCurrentTime(time));
    };

    handleResize();
    updateTime();

    window.addEventListener('resize', handleResize);
    const timeInterval = setInterval(updateTime, 1000);

    const statsInterval = setInterval(() => {
      dispatch(updateStats({
        usersOnline: stats.usersOnline + Math.floor(Math.random() * 10) - 5,
        tasksCompleted: stats.tasksCompleted + Math.floor(Math.random() * 3)
      }));
    }, 30000);

    const tipsInterval = setInterval(() => {
      dispatch(nextTip());
    }, 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(timeInterval);
      clearInterval(statsInterval);
      clearInterval(tipsInterval);
    };
  }, [dispatch, stats.usersOnline, stats.tasksCompleted]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        dispatch(setShowSearch(true));
      }
      if (e.key === 'Escape') {
        dispatch(setShowSearch(false));
        dispatch(toggleNotifications());
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [dispatch]);

  // Navigation handler for tool cards
  const handleNavigation = useCallback((path, toolName) => {
    console.log(`Navigating to ${toolName}: ${path}`);
    try {
      navigate(path);
    } catch (error) {
      console.error(`Navigation failed for ${toolName}:`, error);
    }
  }, [navigate]);

  // Tool data for filtering - Enhanced with data availability indicators
  const tools = [
    {
      id: 'amc',
      title: 'AMC Calculator',
      category: 'financial',
      description: 'Advanced Annual Maintenance Contract calculator with residual value analysis, depreciation modeling, and automated schedule generation.',
      icon: '📊',
      path: '/amc-calculator',
      tag: 'Financial Planning',
      dataStatus: hasExcelData ? 'ready' : 'needs-data',
      statusText: hasExcelData ? 'Excel data available' : 'Upload Excel file first'
    },
    {
      id: 'warranty',
      title: 'Warranty Estimator',
      category: 'risk',
      description: 'Comprehensive warranty period estimation with coverage analysis, geographical mapping, and automated notification systems.',
      icon: '🛡️',
      path: '/warranty-calculator',
      tag: 'Risk Management',
      dataStatus: hasExcelData ? 'ready' : 'needs-data',
      statusText: hasExcelData ? 'Excel data available' : 'Upload Excel file first'
    },
    {
      id: 'payment',
      title: 'AMC Payment Tracker',
      category: 'financial',
      description: 'Comprehensive AMC payment tracking system with real-time transaction monitoring and automated invoice generation.',
      icon: '💳',
      path: '/payment-tracker',
      tag: 'Financial Monitoring',
      dataStatus: hasAMCData ? 'ready' : 'needs-calculations',
      statusText: hasAMCData ? `${totalAMCAssets} AMC records available` : 'Run AMC Calculator first'
    },
    {
      id: 'warranty-tracker',
      title: 'Warranty Payment Tracker',
      category: 'financial',
      description: 'Comprehensive warranty payment tracking system with real-time transaction monitoring and automated invoice generation.',
      icon: '🔍',
      path: '/warranty-tracker',
      tag: 'Financial Monitoring',
      dataStatus: hasWarrantyData ? 'ready' : 'needs-calculations',
      statusText: hasWarrantyData ? `${totalWarrantyAssets} warranty records available` : 'Run Warranty Calculator first'
    }
  ];

  // Filter tools based on search and category using selector
  const filteredTools = useSelector(state => selectFilteredTools(state, tools));

  // Event handlers using dispatch
  const handleMouseEnterCard = useCallback((cardId) => {
    dispatch(setHoveredCard(cardId));
  }, [dispatch]);

  const handleMouseLeaveCard = useCallback(() => {
    dispatch(setHoveredCard(null));
  }, [dispatch]);

  const handleMouseEnterButton = useCallback((buttonId) => {
    dispatch(setHoveredButton(buttonId));
  }, [dispatch]);

  const handleMouseLeaveButton = useCallback(() => {
    dispatch(setHoveredButton(null));
  }, [dispatch]);

  const handleMouseEnterLink = useCallback((linkId) => {
    dispatch(setHoveredLink(linkId));
  }, [dispatch]);

  const handleMouseLeaveLink = useCallback(() => {
    dispatch(setHoveredLink(null));
  }, [dispatch]);

  const handleSearchChange = useCallback((e) => {
    dispatch(setSearchTerm(e.target.value));
  }, [dispatch]);

  const handleCategoryChange = useCallback((category) => {
    dispatch(setSelectedCategory(category));
  }, [dispatch]);

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

  return (
    <div style={styles.container(isDarkMode, isMobile)}>
      <div style={styles.backgroundOverlay(isDarkMode)}></div>
      
      {/* Search Modal */}
      <div style={styles.searchModal(showSearch)} onClick={() => dispatch(setShowSearch(false))}>
        <div style={styles.searchBox} onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            placeholder="Search tools and features..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={styles.searchInput}
            autoFocus
          />
          <div style={styles.searchHint}>
            Press <kbd>Escape</kbd> to close
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div style={styles.sidebar(isDarkMode, isMobile)}>
        <div>
          {/* Header Section */}
          <div style={styles.headerSection}>
            <div style={styles.mainHeader}>
              <h1 style={styles.title}>
                🚀 Financial Dashboard
              </h1>
              <div style={styles.time}>
                {currentTime}
              </div>
            </div>
            
            <p style={styles.subtitle}>
              Advanced financial calculation suite with intelligent automation and comprehensive data management.
            </p>
          </div>

          {/* Quick Stats */}
          <div style={styles.quickStats}>
            <h3 style={styles.quickStatsTitle}>
              📊 Quick Stats
            </h3>
            <div style={styles.quickStatsGrid}>
              <div style={styles.statCard('59, 130, 246')}>
                <div style={styles.statValue('#3b82f6')}>
                  {stats.usersOnline}
                </div>
                <div style={styles.statLabel}>Users Online</div>
              </div>
              <div style={styles.statCard('16, 185, 129')}>
                <div style={styles.statValue('#10b981')}>
                  {stats.tasksCompleted}
                </div>
                <div style={styles.statLabel}>Tasks Done</div>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          {showQuickTips && (
            <div style={styles.quickTips}>
              <div style={styles.quickTipsHeader}>
                <h4 style={styles.quickTipsTitle}>
                  💡 Quick Tip
                </h4>
                <button onClick={handleToggleQuickTips} style={styles.closeButton}>
                  ×
                </button>
              </div>
              <p style={styles.quickTipsText}>
                {quickTips[currentTip]}
              </p>
            </div>
          )}

          {/* Controls */}
          <div style={styles.controls}>
            <button
              onClick={handleToggleSearch}
              onMouseEnter={() => handleMouseEnterButton('search')}
              onMouseLeave={handleMouseLeaveButton}
              style={styles.controlButton(
                hoveredButton === 'search',
                'rgba(59, 130, 246, 0.1)',
                '#3b82f6',
                '#3b82f6',
                'white'
              )}
            >
              🔍 Search Tools (Ctrl+K)
            </button>
            
            <button
              onClick={handleToggleNotifications}
              onMouseEnter={() => handleMouseEnterButton('notifications')}
              onMouseLeave={handleMouseLeaveButton}
              style={styles.controlButton(
                hoveredButton === 'notifications',
                'rgba(245, 158, 11, 0.1)',
                '#f59e0b',
                '#f59e0b',
                'white'
              )}
            >
              🔔 Notifications
              {notifications.length > 0 && (
                <span style={styles.notificationBadge}>
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.footerControls}>
            <span style={styles.themeLabel}>Theme</span>
            <button onClick={handleToggleDarkMode} style={styles.themeButton(isDarkMode)}>
              {isDarkMode ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
          
          <div style={styles.version}>
            Enhanced UI/AI Dashboard v2.0
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <div style={styles.notificationPanel(showNotifications)}>
        <h4 style={styles.notificationTitle}>
          🔔 Notifications
        </h4>
        {notifications.length === 0 ? (
          <p style={styles.noNotifications}>
            No new notifications
          </p>
        ) : (
          notifications.map((notification, index) => (
            <div key={index} style={styles.notificationItem(notification.type)}>
              <div style={styles.notificationItemTitle}>
                {notification.title}
              </div>
              <div style={styles.notificationItemMessage}>
                {notification.message}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main Content */}
      <div style={styles.mainContent(isMobile)}>
        {/* Global Data Management Hub */}
        <ExcelUploadSection />

        {/* Category Filters */}
        <div style={styles.categoryFilters}>
          {['all', 'financial', 'risk', 'monitoring'].map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              style={styles.categoryFilter(selectedCategory === category)}
            >
              {category === 'all' ? '🔍 All Tools' : 
               category === 'financial' ? '💰 Financial' :
               category === 'risk' ? '🛡️ Risk Management' :
               '📊 Monitoring'}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div style={styles.toolsGrid(isMobile)}>
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              style={styles.toolCard(hoveredCard === tool.id)}
              onMouseEnter={() => handleMouseEnterCard(tool.id)}
              onMouseLeave={handleMouseLeaveCard}
              onClick={() => handleNavigation(tool.path, tool.title)}
            >
              {/* Tool Icon */}
              <div style={styles.toolIcon}>{tool.icon}</div>
              
              {/* Tool Tag */}
              <div style={styles.toolTag}>{tool.tag}</div>
              
              {/* Tool Title */}
              <h3 style={styles.toolTitle}>{tool.title}</h3>
              
              {/* Tool Description */}
              <p style={styles.toolDescription}>{tool.description}</p>
              
              {/* Data Status */}
              <div style={styles.statusIndicator(tool.dataStatus)}>
                <div style={styles.statusDot(tool.dataStatus)}></div>
                {tool.statusText}
              </div>
              
              {/* Hover Effect Overlay */}
              {hoveredCard === tool.id && (
                <div style={styles.hoverOverlay}></div>
              )}
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div style={styles.recentActivity}>
            <h3 style={styles.recentActivityTitle}>
              📈 Recent Activity
            </h3>
            <div style={styles.activityList}>
              {recentActivity.map((activity, index) => (
                <div key={index} style={styles.activityItem}>
                  <div style={styles.activityIcon}>{activity.icon}</div>
                  <div style={styles.activityContent}>
                    <div style={styles.activityTitle}>
                      {activity.title}
                    </div>
                    <div style={styles.activityTimestamp}>
                      {activity.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedUIDAIDashboard;