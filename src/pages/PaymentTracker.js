// src/pages/PaymentTracker.js
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Download, BarChart3, Calendar, Search, Filter, 
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, AlertCircle,
  CreditCard, Building, TrendingUp, DollarSign, Package,
  ChevronLeft, ChevronRight, Eye, Edit, MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { updateAmcPaymentStatus } from '../store/slice/amcScheduleSlice';

const PaymentTracker = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get data from Redux global state
  const uploadedFile = useSelector((state) => state.amcSchedule.uploadedFile);
  const amcCalculatedData = useSelector((state) => state.amcSchedule.calculatedData);
  
  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('all');

  

  // Initialize responsive behavior and real-time clock
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
      }));
    };

    handleResize();
    updateTime();

    window.addEventListener('resize', handleResize);
    const timeInterval = setInterval(updateTime, 1000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(timeInterval);
    };
  }, []);

  // Process payment data from AMC calculated data
  const paymentData = useMemo(() => {
    if (!amcCalculatedData) return [];

    const payments = [];
    amcCalculatedData.forEach(product => {
      product.quarterlyData?.forEach(quarter => {
        const dueDate = getQuarterEndDate(quarter.quarter, quarter.year);
        const status = getPaymentStatus(dueDate, quarter.isPaid);
        
        payments.push({
          id: `${product.id}-${quarter.quarter}-${quarter.year}`,
          productId: product.id,
          productName: product.itemName,
          location: product.location,
          quarter: quarter.quarter,
          year: quarter.year,
          quarterDisplay: `${quarter.quarter} ${quarter.year}`,
          amount: quarter.amount,
          amountWithGst: quarter.amountWithGst,
          dueDate: dueDate,
          isPaid: quarter.isPaid || false,
          paidDate: quarter.paidDate || null,
          status: status,
          roiRate: quarter.roiRate
        });
      });
    });

    return payments;
  }, [amcCalculatedData]);

  // Helper functions
  const getQuarterEndDate = (quarter, year) => {
    const quarterEndDates = {
      'JFM': `${year}-04-04`,
      'AMJ': `${year}-07-04`, 
      'JAS': `${year}-10-04`,
      'OND': `${parseInt(year) + 1}-01-04`
    };
    return quarterEndDates[quarter] || null;
  };

  const getPaymentStatus = (dueDate, isPaid) => {
    if (isPaid) return 'paid';
    if (!dueDate) return 'pending';
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 7) return 'urgent';
    return 'pending';
  };

  // Filtered data
  const filteredData = useMemo(() => {
    let filtered = paymentData;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.quarterDisplay.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(item => item.location === locationFilter);
    }

    // Quarter filter
    if (selectedQuarter !== 'all') {
      filtered = filtered.filter(item => item.quarter === selectedQuarter);
    }

    return filtered;
  }, [paymentData, searchTerm, statusFilter, locationFilter, selectedQuarter]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredData.slice(startIndex, endIndex);

  // Statistics
  const stats = useMemo(() => {
    const totalAmount = paymentData.reduce((sum, item) => sum + item.amount, 0);
    const paidAmount = paymentData.filter(item => item.isPaid).reduce((sum, item) => sum + item.amount, 0);
    const pendingAmount = totalAmount - paidAmount;
    const overdueCount = paymentData.filter(item => item.status === 'overdue').length;

    return {
      total: paymentData.length,
      paid: paymentData.filter(item => item.isPaid).length,
      pending: paymentData.filter(item => !item.isPaid).length,
      overdue: overdueCount,
      totalAmount,
      paidAmount,
      pendingAmount
    };
  }, [paymentData]);

  // Chart data
  const statusChartData = useMemo(() => [
    { name: 'Paid', value: stats.paid, color: '#10B981' },
    { name: 'Pending', value: stats.pending - stats.overdue, color: '#F59E0B' },
    { name: 'Overdue', value: stats.overdue, color: '#EF4444' }
  ], [stats]);

  const quarterlyChartData = useMemo(() => {
    const quarters = {};
    paymentData.forEach(item => {
      const key = item.quarterDisplay;
      if (!quarters[key]) {
        quarters[key] = { quarter: key, paid: 0, pending: 0, overdue: 0 };
      }
      if (item.isPaid) {
        quarters[key].paid += item.amount;
      } else if (item.status === 'overdue') {
        quarters[key].overdue += item.amount;
      } else {
        quarters[key].pending += item.amount;
      }
    });
    return Object.values(quarters).slice(0, 8);
  }, [paymentData]);

  // Event handlers
  const handlePaymentToggle = (paymentId) => {
    const payment = paymentData.find(p => p.id === paymentId);
    if (payment) {
      dispatch(updateAmcPaymentStatus({
        productId: payment.productId,
        quarter: payment.quarter,
        year: payment.year,
        isPaid: !payment.isPaid,
        paidDate: !payment.isPaid ? new Date().toISOString() : null
      }));
    }
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      'Product Name': item.productName,
      'Location': item.location,
      'Quarter': item.quarterDisplay,
      'Amount (Ex GST)': item.amount,
      'Amount (Inc GST)': item.amountWithGst,
      'Due Date': item.dueDate,
      'Status': item.status.toUpperCase(),
      'Payment Status': item.isPaid ? 'PAID' : 'UNPAID',
      'Paid Date': item.paidDate ? new Date(item.paidDate).toLocaleDateString() : '-',
      'ROI Rate': `${item.roiRate}%`
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AMC Payment Tracker');
    XLSX.writeFile(wb, `AMC_Payment_Tracker_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Get unique values for filters
  const uniqueLocations = useMemo(() => 
    [...new Set(paymentData.map(item => item.location))], [paymentData]
  );

  const uniqueQuarters = useMemo(() => 
    [...new Set(paymentData.map(item => item.quarter))], [paymentData]
  );

  // Status badge component
  const StatusBadge = ({ status, isPaid }) => {
    const configs = {
      paid: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', icon: CheckCircle },
      pending: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', icon: Clock },
      urgent: { color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)', icon: AlertTriangle },
      overdue: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', icon: AlertCircle }
    };
    
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    
    return (
      <span 
        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
        style={{ color: config.color, backgroundColor: config.bg }}
      >
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Consistent styling with glassmorphism theme
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      color: 'white',
      fontFamily: '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative'
    },
    backgroundOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)
      `,
      pointerEvents: 'none',
    },
    innerContainer: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: isMobile ? '24px' : '48px',
      position: 'relative',
      zIndex: 1
    },
    card: {
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '32px',
      marginBottom: '32px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    statCard: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      padding: '24px',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      textAlign: 'center',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundOverlay}></div>
      
      <div style={styles.innerContainer}>
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="mb-6 px-6 py-3 bg-white/95 backdrop-blur-xl text-gray-900 rounded-xl font-semibold transition-all hover:scale-105 flex items-center gap-3 shadow-xl"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        {/* Header Section */}
        <div style={styles.card}>
          <div className="flex justify-between items-center flex-wrap gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                AMC Payment Tracker
              </h1>
              <p className="text-xl text-blue-200 mb-2">
                Monitor and manage AMC payment schedules
              </p>
              {uploadedFile && (
                <div className="inline-block px-4 py-2 bg-white/10 rounded-lg text-sm text-gray-300">
                  📊 Data Source: {uploadedFile.fileName} ({stats.total} payment records)
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <CreditCard size={32} className="text-white" />
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Current Time</div>
                <div className="text-lg font-semibold text-white">{currentTime} IST</div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div style={styles.statCard}>
            <Package size={24} className="mx-auto mb-3 text-blue-400" />
            <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
            <div className="text-sm text-gray-400">Total Payments</div>
          </div>
          <div style={styles.statCard}>
            <CheckCircle size={24} className="mx-auto mb-3 text-green-400" />
            <div className="text-3xl font-bold text-green-400 mb-1">{stats.paid}</div>
            <div className="text-sm text-gray-400">Paid</div>
            <div className="text-xs text-green-300 mt-1">₹{(stats.paidAmount/100000).toFixed(1)}L</div>
          </div>
          <div style={styles.statCard}>
            <Clock size={24} className="mx-auto mb-3 text-yellow-400" />
            <div className="text-3xl font-bold text-yellow-400 mb-1">{stats.pending}</div>
            <div className="text-sm text-gray-400">Pending</div>
            <div className="text-xs text-yellow-300 mt-1">₹{(stats.pendingAmount/100000).toFixed(1)}L</div>
          </div>
          <div style={styles.statCard}>
            <AlertTriangle size={24} className="mx-auto mb-3 text-red-400" />
            <div className="text-3xl font-bold text-red-400 mb-1">{stats.overdue}</div>
            <div className="text-sm text-gray-400">Overdue</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Payment Status Chart */}
          <div style={styles.card}>
            <h3 className="text-xl font-bold mb-6 text-white">Payment Status Distribution</h3>
            <div className="space-y-4">
              {statusChartData.map((item, index) => {
                const percentage = ((item.value / stats.total) * 100).toFixed(1);
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-white">{item.name}</span>
                        <span className="text-sm text-gray-400">{item.value} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${percentage}%`, 
                            backgroundColor: item.color 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quarterly Breakdown */}
          <div style={styles.card}>
            <h3 className="text-xl font-bold mb-6 text-white">Quarterly Payment Overview</h3>
            <div className="space-y-3">
              {quarterlyChartData.slice(0, 6).map((quarter, index) => {
                const total = quarter.paid + quarter.pending + quarter.overdue;
                return (
                  <div key={index} className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white">{quarter.quarter}</span>
                      <span className="text-sm text-gray-400">₹{(total/100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex gap-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="bg-green-500 transition-all duration-300"
                        style={{ width: `${(quarter.paid/total)*100}%` }}
                      ></div>
                      <div 
                        className="bg-yellow-500 transition-all duration-300"
                        style={{ width: `${(quarter.pending/total)*100}%` }}
                      ></div>
                      <div 
                        className="bg-red-500 transition-all duration-300"
                        style={{ width: `${(quarter.overdue/total)*100}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={styles.card}>
          <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all" className="bg-gray-800">All Status</option>
                <option value="paid" className="bg-gray-800">Paid</option>
                <option value="pending" className="bg-gray-800">Pending</option>
                <option value="urgent" className="bg-gray-800">Urgent</option>
                <option value="overdue" className="bg-gray-800">Overdue</option>
              </select>

              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all" className="bg-gray-800">All Locations</option>
                {uniqueLocations.map(location => (
                  <option key={location} value={location} className="bg-gray-800">
                    {location}
                  </option>
                ))}
              </select>

              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all" className="bg-gray-800">All Quarters</option>
                {uniqueQuarters.map(quarter => (
                  <option key={quarter} value={quarter} className="bg-gray-800">
                    {quarter}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={exportToExcel}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold transition-all hover:scale-105 flex items-center gap-2"
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>

          {/* Payment Table */}
          <div className="overflow-x-auto rounded-xl border border-white/20">
            <table className="min-w-full divide-y divide-white/20">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Product Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Quarter & Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Payment Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/5 divide-y divide-white/10">
                {currentItems.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-white">{payment.productName}</div>
                          <div className="text-sm text-gray-400 flex items-center gap-1">
                            <MapPin size={12} />
                            {payment.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">{payment.quarterDisplay}</div>
                      <div className="text-sm text-green-400">₹{payment.amount.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">({payment.roiRate}% ROI)</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : '-'}
                      </div>
                      {payment.paidDate && (
                        <div className="text-xs text-green-400">
                          Paid: {new Date(payment.paidDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={payment.status} isPaid={payment.isPaid} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handlePaymentToggle(payment.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                          payment.isPaid
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        }`}
                      >
                        {payment.isPaid ? (
                          <>
                            <XCircle size={16} />
                            Mark Unpaid
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} />
                            Mark Paid
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-md text-gray-300 bg-white/5 hover:bg-white/10 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-md text-gray-300 bg-white/5 hover:bg-white/10 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Showing <span className="font-medium text-white">{startIndex + 1}</span> to{' '}
                  <span className="font-medium text-white">{Math.min(endIndex, filteredData.length)}</span> of{' '}
                  <span className="font-medium text-white">{filteredData.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-white/20 bg-white/5 text-sm font-medium text-gray-300 hover:bg-white/10 disabled:opacity-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 border border-white/20 bg-white/5 text-sm font-medium text-gray-300 hover:bg-white/10 disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-white/20 bg-white/5 text-sm font-medium text-white">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 border border-white/20 bg-white/5 text-sm font-medium text-gray-300 hover:bg-white/10 disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-white/20 bg-white/5 text-sm font-medium text-gray-300 hover:bg-white/10 disabled:opacity-50"
                  >
                    Last
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={styles.card}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Digital Infrastructure Toolkit</h3>
                <p className="text-sm text-gray-400">AMC Payment Management System</p>
              </div>
            </div>
            <div className="border-t border-white/20 pt-4">
              <p className="text-sm text-gray-400">
                © 2024 Digital India Initiative. Built with modern web technologies.
              </p>
              <div className="flex justify-center gap-6 mt-2 text-xs text-gray-500">
                <span>Last Updated: {currentTime}</span>
                <span>•</span>
                <span>Version 2.0</span>
                <span>•</span>
                <span>Secure & Reliable</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PaymentTracker;