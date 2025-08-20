import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { database, auth } from "../../firebase/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, AlertTriangle, CheckCircle, Clock, TrendingUp, Edit, Trash2, Plus, Filter, Building2, Shield, Users } from 'lucide-react';
import QRCode from "react-qr-code";
import AddClinicInventory from "./addClinicInventory";
import EditClinicInventory from "./EditClinicInventory";
import ClinicStockIn from "./ClinicStockIn";
import DeleteClinicInventory from "./DeleteClinicInventory";
import DepartmentBreakdownModal from "./DepartmentBreakdownModal";
import DateRangePicker from "../../components/DateRangePicker/DateRangePicker";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function ClinicInventoryVisual() {
  const [inventory, setInventory] = useState([]);
  const [inventoryNames, setInventoryNames] = useState({});
  const [clinics, setClinics] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDepartmentBreakdownOpen, setIsDepartmentBreakdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [viewType, setViewType] = useState("cards");
  
  // Role-based access control states
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedClinicFilter, setSelectedClinicFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockLevelFilter, setStockLevelFilter] = useState("all");

  // Dynamic status calculation function - calculates status in real-time
  const calculateDynamicStatus = (quantity, thresholdBase) => {
    if (quantity <= 0) {
      return 'Critical';
    }
    
    // Calculate 50% threshold based on thresholdBase
    const threshold = Math.floor(thresholdBase * 0.5);
    
    if (quantity < threshold) {
      return 'Low';
    }
    
    return 'Good';
  };

  const toggleAddModal = () => setIsAddModalOpen(!isAddModalOpen);
  const toggleEditModal = () => setIsEditModalOpen(!isEditModalOpen);
  const toggleStockInModal = () => setIsStockInModalOpen(!isStockInModalOpen);
  const toggleDeleteModal = () => setIsDeleteModalOpen(!isDeleteModalOpen);
  const toggleDepartmentBreakdown = () => setIsDepartmentBreakdownOpen(!isDepartmentBreakdownOpen);

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleStockIn = (item) => {
    setSelectedItem(item);
    setIsStockInModalOpen(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleDepartmentBreakdown = (item) => {
    setSelectedItem(item);
    setIsDepartmentBreakdownOpen(true);
  };

  const closeAllModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsStockInModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsDepartmentBreakdownOpen(false);
    setSelectedItem(null);
  };

  // Check if user has admin privileges
  const isAdminUser = () => {
    return userProfile && (userProfile.role === 'admin' || userProfile.role === 'superadmin');
  };

  // Get user's clinic ID from clinicAffiliation
  const getUserClinicId = () => {
    return userProfile?.clinicAffiliation;
  };

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    // Load user profile when currentUser changes
    if (currentUser) {
      const userProfileRef = ref(database, `users/${currentUser.uid}`);
      const unsubscribeUserProfile = onValue(userProfileRef, (snapshot) => {
        const userData = snapshot.val();
        setUserProfile(userData);
      });

      return () => {
        unsubscribeAuth();
        unsubscribeUserProfile();
      };
    }

    return () => {
      unsubscribeAuth();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!userProfile) return;

    // Load clinics data for admin users
    const clinicsRef = ref(database, "clinics");
    const unsubscribeClinics = onValue(clinicsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setClinics(data);
    });

    // Load inventory names
    const inventoryRef = ref(database, "inventoryItems");
    const unsubscribeInventory = onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val() || {};
      const nameMap = {};
      Object.entries(data).forEach(([id, details]) => {
        nameMap[id] = details.itemName;
      });
      setInventoryNames(nameMap);
    });

    // Load clinic inventory based on user role with dynamic status calculation
    const clinicInventoryRef = ref(database, "clinicInventoryStock");
    const unsubscribeClinicInventory = onValue(clinicInventoryRef, (snapshot) => {
      const data = snapshot.val() || {};
      const formattedData = [];

      Object.entries(data).forEach(([clinicId, clinicItems]) => {
        // Apply role-based filtering
        if (!isAdminUser() && clinicId !== getUserClinicId()) {
          return; // Skip this clinic if user is not admin and clinic doesn't match
        }

        Object.entries(clinicItems).forEach(([itemId, itemDetails]) => {
          // Calculate dynamic status instead of using stored status
          const thresholdBase = itemDetails.thresholdBase || itemDetails.quantity || 0;
          const currentQuantity = itemDetails.quantity || 0;
          const dynamicStatus = calculateDynamicStatus(currentQuantity, thresholdBase);
          
          formattedData.push({
            clinicId,
            itemId,
            ...itemDetails,
            status: dynamicStatus, // Override with dynamically calculated status
          });
        });
      });

      setInventory(formattedData);
    });

    return () => {
      unsubscribeClinics();
      unsubscribeInventory();
      unsubscribeClinicInventory();
    };
  }, [userProfile]);

  // Enhanced filtering with role-based access and categorization
  const filteredInventory = inventory.filter((item) => {
    const name = inventoryNames[item.itemId] || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const itemDate = new Date(item.lastUpdated);
    const inDateRange =
      (!startDate || itemDate >= startDate) &&
      (!endDate || itemDate <= endDate);
    
    // Clinic filter (only for admins)
    const matchesClinicFilter = selectedClinicFilter === "all" || item.clinicId === selectedClinicFilter;
    
    // Stock level filter - now uses dynamically calculated status
    const matchesStockFilter = stockLevelFilter === "all" || item.status === stockLevelFilter;
    
    // Category filter (if available in item data)
    const matchesCategoryFilter = categoryFilter === "all" || item.category === categoryFilter;
    
    return matchesSearch && inDateRange && matchesClinicFilter && matchesStockFilter && matchesCategoryFilter;
  }).sort((a, b) => {
    const nameA = inventoryNames[a.itemId]?.toLowerCase() || "";
    const nameB = inventoryNames[b.itemId]?.toLowerCase() || "";
    return nameA.localeCompare(nameB);
  });

  // Get unique categories for filter
  const availableCategories = [...new Set(inventory.map(item => item.category).filter(Boolean))];

  // Prepare data for charts
  const chartData = filteredInventory.map(item => ({
    name: inventoryNames[item.itemId] || item.itemId,
    quantity: item.quantity,
    status: item.status,
    clinic: clinics[item.clinicId]?.name || item.clinicId,
    thresholdBase: item.thresholdBase || item.quantity,
    threshold: Math.floor((item.thresholdBase || item.quantity) * 0.5)
  }));

  // Status data using dynamically calculated status
  const statusData = [
    { name: 'Good', value: filteredInventory.filter(item => item.status === 'Good').length, color: '#10b981' },
    { name: 'Low', value: filteredInventory.filter(item => item.status === 'Low').length, color: '#f59e0b' },
    { name: 'Critical', value: filteredInventory.filter(item => item.status === 'Critical').length, color: '#ef4444' }
  ];

  // Clinic distribution data for admins
  const clinicData = isAdminUser() ? 
    Object.entries(
      filteredInventory.reduce((acc, item) => {
        const clinicName = clinics[item.clinicId]?.name || item.clinicId;
        acc[clinicName] = (acc[clinicName] || 0) + item.quantity;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value })) : [];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Good':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Low':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'Critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Good':
        return 'bg-green-100 border-green-200';
      case 'Low':
        return 'bg-yellow-100 border-yellow-200';
      case 'Critical':
        return 'bg-red-100 border-red-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const totalItems = filteredInventory.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = filteredInventory.filter(item => item.status === 'Low' || item.status === 'Critical').length;
  const uniqueClinics = isAdminUser() ? new Set(filteredInventory.map(item => item.clinicId)).size : 1;

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const lineSpacing = 10;
    let y = 15;

    doc.setFontSize(14);
    doc.text(`${isAdminUser() ? 'Multi-Clinic' : 'Clinic'} Inventory Report`, 14, y);
    
    y += lineSpacing;
    doc.setFontSize(11);
    doc.text(`Generated by: ${userProfile?.name || 'Unknown User'} (${userProfile?.role || 'user'})`, 14, y);

    if (startDate && endDate) {
      y += lineSpacing;
      doc.text(
        `Date Range: ${startDate.toISOString().split("T")[0]} to ${endDate
          .toISOString()
          .split("T")[0]}`,
        14,
        y
      );
    }

    const tableStartY = y + lineSpacing + 5;

    const tableData = filteredInventory.map((item) => [
      inventoryNames[item.itemId] || item.itemId,
      clinics[item.clinicId]?.name || item.clinicId,
      item.quantity,
      item.thresholdBase || item.quantity,
      Math.floor((item.thresholdBase || item.quantity) * 0.5),
      item.lastUpdated,
      item.status, // This will now show the dynamically calculated status
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [["Item Name", "Clinic", "Quantity", "Threshold Base", "Low Threshold", "Last Updated", "Status"]],
      body: tableData,
      styles: { fontSize: 10 },
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${isAdminUser() ? 'Multi_Clinic' : 'Clinic'}_Inventory_${timestamp}.pdf`;
    doc.save(filename);
  };

  // Show loading state while checking auth
  if (authLoading || !userProfile) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user profile...</p>
        </div>
      </div>
    );
  }

  // Show login required message if not authenticated
  if (!currentUser) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access the inventory dashboard.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      {/* Header with Role Badge */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold text-gray-800">
            {isAdminUser() ? 'Multi-Clinic' : 'Clinic'} Inventory Dashboard
          </h2>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            isAdminUser() ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {isAdminUser() ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            {userProfile?.role || 'user'}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleGeneratePDF}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Generate PDF
          </button>
          <button
            onClick={toggleAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Item to Clinic Inventory
          </button>
          <button
            onClick={() => setViewType('cards')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewType === 'cards' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            Cards View
          </button>
          <button
            onClick={() => setViewType('charts')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewType === 'charts' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            Charts View
          </button>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filters & Search</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-4 py-2 rounded-md"
          />

          {/* Clinic Filter (Only for Admins) */}
          {isAdminUser() && (
            <select
              value={selectedClinicFilter}
              onChange={(e) => setSelectedClinicFilter(e.target.value)}
              className="border px-4 py-2 rounded-md"
            >
              <option value="all">All Clinics</option>
              {Object.entries(clinics).map(([id, clinic]) => (
                <option key={id} value={id}>
                  {clinic.name || id}
                </option>
              ))}
            </select>
          )}

          {/* Stock Level Filter - Uses dynamically calculated status */}
          <select
            value={stockLevelFilter}
            onChange={(e) => setStockLevelFilter(e.target.value)}
            className="border px-4 py-2 rounded-md"
          >
            <option value="all">All Stock Levels</option>
            <option value="Good">Good Stock</option>
            <option value="Low">Low Stock</option>
            <option value="Critical">Critical</option>
          </select>

          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border px-4 py-2 rounded-md"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}

          {/* Date Range */}
          <div className="lg:col-span-2">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={(date) => setStartDate(date)}
              onEndDateChange={(date) => setEndDate(date)}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Products</p>
              <p className="text-2xl font-bold text-gray-900">{filteredInventory.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {isAdminUser() && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Clinics</p>
                <p className="text-2xl font-bold text-gray-900">{uniqueClinics}</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-red-600">{lowStockItems}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Access Level</p>
              <p className="text-sm font-bold text-gray-900">
                {isAdminUser() ? 'Multi-Clinic' : 'Single Clinic'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewType === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredInventory.map((item) => {
            const thresholdBase = item.thresholdBase || item.quantity;
            const threshold = Math.floor(thresholdBase * 0.5);
            const percentageOfBase = Math.min((item.quantity / thresholdBase) * 100, 100);
            
            return (
              <div
                key={`${item.clinicId}-${item.itemId}`}
                className={`bg-white rounded-xl shadow-lg border-2 p-4 transition-transform hover:scale-105 ${getStatusColor(item.status)} flex flex-col h-full`}
              >
                {/* Header Section */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="text-xs font-medium text-gray-600">{item.status}</span>
                  </div>
                  {isAdminUser() && (
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {clinics[item.clinicId]?.name || item.clinicId}
                    </div>
                  )}
                </div>
                
                {/* Title and Quantity Section */}
                <div className="mb-3 flex-grow">
                  <h3 className="text-base font-bold text-gray-800 mb-2 line-clamp-2 leading-tight">
                    {inventoryNames[item.itemId] || item.itemId}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-gray-900">{item.quantity}</span>
                    <span className="text-sm text-gray-600">units</span>
                  </div>
                  
                  {/* Dynamic Threshold Information */}
                  <div className="text-xs text-gray-500 space-y-1 mb-2">
                    <div className="flex justify-between">
                      <span>Threshold Base:</span>
                      <span className="font-medium">{thresholdBase}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low Threshold:</span>
                      <span className="font-medium">{threshold}</span>
                    </div>
                  </div>

                  {item.category && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-2 inline-block">
                      {item.category}
                    </div>
                  )}
                </div>

                {/* Enhanced Progress Bar with Threshold Marker */}
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2 relative">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        item.status === 'Good' ? 'bg-green-500' :
                        item.status === 'Low' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${percentageOfBase}%`
                      }}
                    ></div>
                    {/* Threshold marker at 50% */}
                    <div 
                      className="absolute top-0 w-0.5 h-2 bg-red-600 opacity-70"
                      style={{ left: '50%' }}
                      title={`Low Stock Threshold: ${threshold} units`}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span className="text-red-500">← {threshold}</span>
                    <span>{thresholdBase}</span>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="text-xs text-gray-500 mb-3">
                  Last updated: {item.lastUpdated}
                </div>
                
                {/* QR Code */}
                <div className="mb-4 flex justify-center">
                  <QRCode value={`${item.itemId}`} size={35} />
                </div>

                {/* Action Buttons */}
                <div className="mt-auto space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 bg-blue-500 text-white px-2 py-1.5 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-1 text-xs font-medium"
                      title="Edit Item"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleStockIn(item)}
                      className="flex-1 bg-green-500 text-white px-2 py-1.5 rounded-md hover:bg-green-600 transition-colors flex items-center justify-center gap-1 text-xs font-medium"
                      title="Stock In"
                    >
                      <Plus className="w-3 h-3" />
                      Stock In
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDepartmentBreakdown(item)}
                      className="flex-1 bg-purple-500 text-white px-2 py-1.5 rounded-md hover:bg-purple-600 transition-colors flex items-center justify-center gap-1 text-xs font-medium"
                      title="Department Breakdown"
                    >
                      <Building2 className="w-3 h-3" />
                      Departments
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="flex-1 bg-red-500 text-white px-2 py-1.5 rounded-md hover:bg-red-600 transition-colors flex items-center justify-center gap-1 text-xs font-medium"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">Inventory Quantities vs Thresholds</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip formatter={(value, name) => {
                  if (name === 'quantity') return [value, 'Current Stock'];
                  if (name === 'threshold') return [value, 'Low Threshold (50%)'];
                  if (name === 'thresholdBase') return [value, 'Threshold Base'];
                  return [value, name];
                }} />
                <Bar dataKey="quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} name="quantity" />
                <Bar dataKey="threshold" fill="#f59e0b" radius={[2, 2, 0, 0]} name="threshold" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Clinic Distribution Chart (Admin Only) */}
          {isAdminUser() && clinicData.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-lg lg:col-span-2">
              <h3 className="text-xl font-bold mb-4">Inventory Distribution by Clinic</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clinicData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Enhanced Detailed View with Dynamic Threshold Information */}
          <div className="bg-white p-6 rounded-xl shadow-lg lg:col-span-2">
            <h3 className="text-xl font-bold mb-4">Detailed Inventory View</h3>
            <div className="space-y-4">
              {filteredInventory.map((item) => {
                const thresholdBase = item.thresholdBase || item.quantity;
                const threshold = Math.floor(thresholdBase * 0.5);
                const percentageOfBase = Math.min((item.quantity / thresholdBase) * 100, 100);
                
                return (
                  <div key={`${item.clinicId}-${item.itemId}`} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-32 text-sm font-medium text-gray-700 truncate">
                      {inventoryNames[item.itemId] || item.itemId}
                    </div>
                    {isAdminUser() && (
                      <div className="w-24 text-xs text-gray-600 truncate">
                        {clinics[item.clinicId]?.name || item.clinicId}
                      </div>
                    )}
                    
                    {/* Threshold Information */}
                    <div className="w-20 text-xs text-gray-500">
                      <div>Base: {thresholdBase}</div>
                      <div>Low: {threshold}</div>
                    </div>
                    
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div
                        className={`h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-bold ${
                          item.status === 'Good' ? 'bg-green-500' :
                          item.status === 'Low' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{
                          width: `${percentageOfBase}%`
                        }}
                      >
                        {item.quantity}
                      </div>
                      {/* Threshold marker */}
                      <div 
                        className="absolute top-0 w-0.5 h-6 bg-red-600 opacity-70"
                        style={{ left: '50%' }}
                        title={`Low Threshold: ${threshold}`}
                      ></div>
                    </div>
                    <div className="w-16 text-sm text-gray-600">
                      {item.status}
                    </div>
                    <div className="w-12 flex justify-center">
                      <QRCode value={`${item.clinicId}-${item.itemId}`} size={30} />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        title="Edit"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleStockIn(item)}
                        className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                        title="Stock In"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDepartmentBreakdown(item)}
                        className="p-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                        title="Department Breakdown"
                      >
                        <Building2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl relative">
            <button
              onClick={closeAllModals}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✕
            </button>
            <AddClinicInventory 
              onClose={closeAllModals} 
              userClinicId={isAdminUser() ? null : getUserClinicId()}
              isAdminUser={isAdminUser()}
            />
          </div>
        </div>
      )}

      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl relative">
            <button
              onClick={closeAllModals}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✕
            </button>
            <EditClinicInventory 
              item={selectedItem} 
              onClose={closeAllModals}
              isAdminUser={isAdminUser()}
            />
          </div>
        </div>
      )}

      {isStockInModalOpen && selectedItem && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl relative">
            <button
              onClick={closeAllModals}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✕
            </button>
            <ClinicStockIn 
              item={selectedItem} 
              onClose={closeAllModals} 
              currentUserId={currentUser.uid}
              isAdminUser={isAdminUser()}
            />
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
            <button
              onClick={closeAllModals}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✕
            </button>
            <DeleteClinicInventory 
              item={selectedItem} 
              onClose={closeAllModals}
              isAdminUser={isAdminUser()}
            />
          </div>
        </div>
      )}
      {isDepartmentBreakdownOpen && selectedItem && (
        <DepartmentBreakdownModal
          item={selectedItem}
          onClose={closeAllModals}
          inventoryNames={inventoryNames}
          clinics={clinics}
        />
      )}
    </div>
  );
}

export default ClinicInventoryVisual;