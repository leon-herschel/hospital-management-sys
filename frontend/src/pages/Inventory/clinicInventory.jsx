import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { database, auth } from "../../firebase/firebase"; // Make sure to import auth
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, AlertTriangle, CheckCircle, Clock, TrendingUp, Edit, Trash2, Plus } from 'lucide-react';
import QRCode from "react-qr-code";
import AddClinicInventory from "./addClinicInventory";
import EditClinicInventory from "./EditClinicInventory";
import ClinicStockIn from "./ClinicStockIn";
import DeleteClinicInventory from "./DeleteClinicInventory";
import DateRangePicker from "../../components/DateRangePicker/DateRangePicker";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function ClinicInventoryVisual() { // Remove currentUserId prop, we'll get it from Firebase Auth
  const [inventory, setInventory] = useState([]);
  const [inventoryNames, setInventoryNames] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [viewType, setViewType] = useState("cards");
  
  // Add state for current user
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const toggleAddModal = () => setIsAddModalOpen(!isAddModalOpen);
  const toggleEditModal = () => setIsEditModalOpen(!isEditModalOpen);
  const toggleStockInModal = () => setIsStockInModalOpen(!isStockInModalOpen);
  const toggleDeleteModal = () => setIsDeleteModalOpen(!isDeleteModalOpen);

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleStockIn = (item) => {
    console.log('handleStockIn called with:', { item, currentUserId: currentUser?.uid }); // Debug log
    setSelectedItem(item);
    setIsStockInModalOpen(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const closeAllModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsStockInModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
  };

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user); // Debug log
      setCurrentUser(user);
      setAuthLoading(false);
    });

    const inventoryRef = ref(database, "inventoryItems");
    const unsubscribeInventory = onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val() || {};
      const nameMap = {};
      Object.entries(data).forEach(([id, details]) => {
        nameMap[id] = details.itemName;
      });
      setInventoryNames(nameMap);
    });

    const clinicInventoryRef = ref(database, "clinicInventoryStock");
    const unsubscribeClinicInventory = onValue(clinicInventoryRef, (snapshot) => {
      const data = snapshot.val() || {};
      const formattedData = [];

      Object.entries(data).forEach(([clinicId, clinicItems]) => {
        Object.entries(clinicItems).forEach(([itemId, itemDetails]) => {
          formattedData.push({
            clinicId,
            itemId,
            ...itemDetails,
          });
        });
      });

      setInventory(formattedData);
    });

    // Cleanup function
    return () => {
      unsubscribeAuth();
      unsubscribeInventory();
      unsubscribeClinicInventory();
    };
  }, []);

  // Filter inventory based on search and date range
  const filteredInventory = inventory.filter((item) => {
    const name = inventoryNames[item.itemId] || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const itemDate = new Date(item.lastUpdated);
    const inDateRange =
      (!startDate || itemDate >= startDate) &&
      (!endDate || itemDate <= endDate);
    return matchesSearch && inDateRange;
  }).sort((a, b) => {
    const nameA = inventoryNames[a.itemId]?.toLowerCase() || "";
    const nameB = inventoryNames[b.itemId]?.toLowerCase() || "";
    return nameA.localeCompare(nameB);
  });

  // Prepare data for charts
  const chartData = filteredInventory.map(item => ({
    name: inventoryNames[item.itemId] || item.itemId,
    quantity: item.quantity,
    status: item.status
  }));

  const statusData = [
    { name: 'In Stock', value: filteredInventory.filter(item => item.status === 'In Stock').length, color: '#10b981' },
    { name: 'Low Stock', value: filteredInventory.filter(item => item.status === 'Low Stock').length, color: '#f59e0b' },
    { name: 'Critical', value: filteredInventory.filter(item => item.status === 'Critical').length, color: '#ef4444' }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'In Stock':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Low Stock':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'Critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 border-green-200';
      case 'Low Stock':
        return 'bg-yellow-100 border-yellow-200';
      case 'Critical':
        return 'bg-red-100 border-red-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const totalItems = filteredInventory.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = filteredInventory.filter(item => item.status === 'Low Stock' || item.status === 'Critical').length;

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const lineSpacing = 10;
    let y = 15;

    doc.setFontSize(14);
    doc.text("Clinic Inventory Report", 14, y);

    // Show date range only if selected
    if (startDate && endDate) {
      y += lineSpacing;
      doc.setFontSize(11);
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
      item.quantity,
      item.lastUpdated,
      item.status,
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [["Item Name", "Quantity", "Last Updated", "Status"]],
      body: tableData,
      styles: { fontSize: 10 },
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename =
      startDate && endDate
        ? `Clinic_Inventory_${timestamp}_filtered.pdf`
        : `Clinic_Inventory_${timestamp}.pdf`;

    doc.save(filename);
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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

  console.log('Rendering with currentUser:', currentUser?.uid); // Debug log

  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      {/* Debug Info - Remove this in production */}

      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h2 className="text-3xl font-bold text-gray-800">Clinic Inventory Dashboard</h2>
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

      {/* Search and Filters */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by item name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 rounded-md w-full max-w-sm"
        />

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(date) => setStartDate(date)}
          onEndDateChange={(date) => setEndDate(date)}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-sm font-bold text-gray-900">Today</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewType === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredInventory.map((item) => (
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
                <div className="text-xs text-gray-500">{item.clinicId}</div>
              </div>
              
              {/* Title and Quantity Section */}
              <div className="mb-3 flex-grow">
                <h3 className="text-base font-bold text-gray-800 mb-2 line-clamp-2 leading-tight">
                  {inventoryNames[item.itemId] || item.itemId}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-gray-900">{item.quantity}</span>
                  <span className="text-sm text-gray-600">units</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      item.status === 'In Stock' ? 'bg-green-500' :
                      item.status === 'Low Stock' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min((item.quantity / 300) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Last Updated */}
              <div className="text-xs text-gray-500 mb-3">
                Last updated: {item.lastUpdated}
              </div>
              
              {/* QR Code */}
              <div className="mb-4 flex justify-center">
                <QRCode value={item.itemId} size={35} />
              </div>

              {/* Action Buttons - Stacked Layout */}
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
                <button
                  onClick={() => handleDelete(item)}
                  className="w-full bg-red-500 text-white px-2 py-1.5 rounded-md hover:bg-red-600 transition-colors flex items-center justify-center gap-1 text-xs font-medium"
                  title="Delete Item"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">Inventory Quantities</h3>
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
                <Tooltip />
                <Bar dataKey="quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
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

          {/* Horizontal Bar Chart for Better Item Name Visibility */}
          <div className="bg-white p-6 rounded-xl shadow-lg lg:col-span-2">
            <h3 className="text-xl font-bold mb-4">Detailed Inventory View with QR Codes</h3>
            <div className="space-y-4">
              {filteredInventory.map((item) => (
                <div key={`${item.clinicId}-${item.itemId}`} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium text-gray-700 truncate">
                    {inventoryNames[item.itemId] || item.itemId}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className={`h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-bold ${
                        item.status === 'In Stock' ? 'bg-green-500' :
                        item.status === 'Low Stock' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min((item.quantity / 300) * 100, 100)}%`
                      }}
                    >
                      {item.quantity}
                    </div>
                  </div>
                  <div className="w-20 text-sm text-gray-600">
                    {item.status}
                  </div>
                  <div className="w-12 flex justify-center">
                    <QRCode value={item.itemId} size={30} />
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
                      onClick={() => handleDelete(item)}
                      className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
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
            <AddClinicInventory onClose={closeAllModals} />
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
            <EditClinicInventory item={selectedItem} onClose={closeAllModals} />
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
            <DeleteClinicInventory item={selectedItem} onClose={closeAllModals} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ClinicInventoryVisual;