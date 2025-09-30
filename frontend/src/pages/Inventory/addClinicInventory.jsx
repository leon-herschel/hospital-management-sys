import React, { useState, useEffect } from "react";
import { ref, onValue, set, get } from "firebase/database";
import { getAuth } from "firebase/auth";
import { database } from "../../firebase/firebase";

function AddClinicInventory() {
  const [clinicId, setClinicId] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [availableClinics, setAvailableClinics] = useState([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Enhanced utility function for calculating status based on dynamic threshold
  const calculateInventoryStatus = (currentQuantity, thresholdBase) => {
    if (currentQuantity <= 0) {
      return 'Critical';
    }
    
    // Calculate 50% threshold based on thresholdBase
    const threshold = Math.floor(thresholdBase * 0.5);
    
    if (currentQuantity < threshold) {
      return 'Low';
    }
    
    return 'Good';
  };

  useEffect(() => {
    // Fetch all inventory items
    const inventoryRef = ref(database, "inventoryItems");
    onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val() || {};
      const items = Object.entries(data).map(([id, details]) => ({
        id,
        name: details.itemName,
      }));
      setInventoryItems(items);
    });

    // Fetch logged-in user and determine role/clinic access
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      get(userRef).then((snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          setUserRole(userData.role || "");
          
          // If admin or superadmin, fetch all clinics
          if (userData.role === "admin" || userData.role === "superadmin") {
            const clinicsRef = ref(database, "clinics");
            get(clinicsRef).then((clinicsSnapshot) => {
              const clinicsData = clinicsSnapshot.val() || {};
              const clinicsList = Object.entries(clinicsData).map(([id, details]) => ({
                id,
                name: details.name || `Clinic ${id}`,
              }));
              setAvailableClinics(clinicsList);
              setIsLoadingUser(false);
            });
          } else {
            // For regular users, use their clinic affiliation
            if (userData.clinicAffiliation) {
              setClinicId(userData.clinicAffiliation);
              
              // Fetch the clinic name for display
              const clinicRef = ref(database, `clinics/${userData.clinicAffiliation}`);
              get(clinicRef).then((clinicSnap) => {
                const clinicData = clinicSnap.val();
                if (clinicData?.name) {
                  setClinicName(clinicData.name);
                }
                setIsLoadingUser(false);
              });
            } else {
              setIsLoadingUser(false);
            }
          }
        } else {
          setIsLoadingUser(false);
        }
      });
    } else {
      setIsLoadingUser(false);
    }
  }, []);

  // Handle clinic selection for admins
  const handleClinicChange = (selectedClinicId) => {
    setClinicId(selectedClinicId);
    const selectedClinic = availableClinics.find(clinic => clinic.id === selectedClinicId);
    setClinicName(selectedClinic ? selectedClinic.name : "");
  };

  // Updated handleSubmit function in AddClinicInventory.js
  const handleSubmit = async () => {
    if (!clinicId || !selectedItemId || !quantity) {
      alert("Please complete all required fields.");
      return;
    }

    const itemRef = ref(
      database,
      `clinicInventoryStock/${clinicId}/${selectedItemId}`
    );

    const quantityNumber = parseInt(quantity);
    
    // Check if this item already exists to preserve existing data
    const existingSnapshot = await get(itemRef);
    const existingData = existingSnapshot.val() || {};
    
    // For new items, the initial quantity becomes the thresholdBase
    // For existing items, we maintain the existing thresholdBase
    const thresholdBase = existingSnapshot.exists() ? 
      (existingData.thresholdBase || quantityNumber) : 
      quantityNumber;
    
    // Calculate the 50% threshold based on thresholdBase
    const threshold = Math.floor(thresholdBase * 0.5);
    
    const payload = {
      quantity: quantityNumber,
      thresholdBase: thresholdBase,
      lastUpdated: new Date().toISOString(),
      // REMOVED: status field - calculate dynamically instead
      departmentStock: existingData.departmentStock || {},
      // Store the original quantity for historical reference
      originalQuantity: existingData.originalQuantity || quantityNumber,
      // Store the current threshold for transparency
      currentThreshold: threshold
    };

    setLoading(true);
    try {
      await set(itemRef, payload);
      
      // Calculate status for display in alert only
      const displayStatus = calculateInventoryStatus(quantityNumber, thresholdBase);
      
      alert(
        `Clinic inventory ${existingSnapshot.exists() ? 'updated' : 'added'} successfully!\n` +
        `Clinic: ${clinicName}\n` +
        `Status: ${displayStatus}\n` +
        `Threshold Base: ${thresholdBase} units\n` +
        `Low Stock Threshold: ${threshold} units (50% of base)`
      );
      setSelectedItemId("");
      setQuantity("");
    } catch (error) {
      console.error(error);
      alert("Failed to save clinic inventory.");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced preview calculation for display
  const getPreviewInfo = () => {
    if (!quantity || isNaN(quantity)) return null;
    
    const quantityNumber = parseInt(quantity);
    
    // For new items, the initial quantity becomes the thresholdBase
    const thresholdBase = quantityNumber;
    const threshold = Math.floor(thresholdBase * 0.5);
    const status = calculateInventoryStatus(quantityNumber, thresholdBase);
    
    return {
      quantity: quantityNumber,
      thresholdBase,
      threshold,
      status,
      percentageOfBase: 100, // New items are always at 100% initially
      unitsUntilLow: Math.max(0, quantityNumber - threshold),
      isAboveThreshold: quantityNumber >= threshold
    };
  };

  const previewInfo = getPreviewInfo();

  // Show loading state while fetching user data
  if (isLoadingUser) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-500/5 p-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="text-slate-600 text-lg font-medium">Loading user information...</div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has permission to add inventory
  const canAddInventory = userRole === "admin" || userRole === "superadmin" || clinicId;

  if (!canAddInventory) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-red-50 to-rose-100 backdrop-blur-sm border border-red-200/60 rounded-2xl shadow-xl shadow-red-500/5 p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-red-700">Access Restricted</h2>
            <p className="text-red-600/80 text-lg">You don't have permission to add clinic inventory or no clinic affiliation found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-white via-slate-50 to-indigo-50 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-500/10 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-8 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
              <span>Add Clinic Inventory</span>
            </h2>
            <p className="text-indigo-100/90">Manage inventory with dynamic threshold monitoring</p>
          </div>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Clinic Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3 text-slate-700 flex items-center space-x-2">
              <span>Clinic</span>
              {(userRole === "admin" || userRole === "superadmin") && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Select any clinic
                </span>
              )}
            </label>
            
            {userRole === "admin" || userRole === "superadmin" ? (
              <select
                value={clinicId}
                onChange={(e) => handleClinicChange(e.target.value)}
                className="w-full p-4 border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 shadow-sm hover:border-slate-400"
              >
                <option value="">Select a clinic...</option>
                {availableClinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="relative">
                <select
                  value={clinicId}
                  disabled
                  className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed shadow-sm"
                >
                  <option value={clinicId}>{clinicName || "Loading..."}</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Selected Clinic Info for Admins */}
          {(userRole === "admin" || userRole === "superadmin") && clinicId && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Selected Clinic</p>
                    <p className="text-lg font-semibold text-blue-800">{clinicName}</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-medium rounded-full shadow-sm">
                  {userRole === "superadmin" ? "Super Admin" : "Admin"} Access
                </div>
              </div>
            </div>
          )}

          {/* Inventory Item Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3 text-slate-700">Inventory Item</label>
            <div className="relative">
              <input
                list="inventory-options"
                placeholder="Type or select inventory item"
                className="w-full p-4 border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 shadow-sm hover:border-slate-400 pl-12"
                onChange={(e) => {
                  const selected = inventoryItems.find(item => item.name === e.target.value);
                  setSelectedItemId(selected ? selected.id : "");
                }}
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <datalist id="inventory-options">
              {inventoryItems.map((item) => (
                <option key={item.id} value={item.name} />
              ))}
            </datalist>
          </div>

          {/* Quantity Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3 text-slate-700">Initial Quantity</label>
            <div className="relative">
              <input
                type="number"
                placeholder="Enter initial quantity"
                className="w-full p-4 border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 shadow-sm hover:border-slate-400 pl-12"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Enhanced Preview Section */}
          {previewInfo && (
            <div className="mb-8 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 border border-violet-200/60 rounded-2xl p-6 shadow-lg shadow-violet-500/5">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-violet-900 text-xl">Dynamic Threshold Preview</h3>
              </div>
              
              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/60 shadow-lg shadow-indigo-500/5 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                    </svg>
                  </div>
                  <p className="text-sm text-indigo-600 mb-1 font-medium">Initial Quantity</p>
                  <p className="text-3xl font-bold text-indigo-800 mb-1">{previewInfo.quantity}</p>
                  <p className="text-xs text-indigo-500">units</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/60 shadow-lg shadow-purple-500/5 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-purple-600 mb-1 font-medium">Threshold Base</p>
                  <p className="text-3xl font-bold text-purple-800 mb-1">{previewInfo.thresholdBase}</p>
                  <p className="text-xs text-purple-500">baseline</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/60 shadow-lg shadow-orange-500/5 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-orange-600 mb-1 font-medium">Low Stock Threshold</p>
                  <p className="text-3xl font-bold text-orange-800 mb-1">{previewInfo.threshold}</p>
                  <p className="text-xs text-orange-500">50% of base</p>
                </div>
              </div>

              {/* Status Display */}
              <div className="text-center mb-6">
                <p className="text-sm text-violet-600 mb-3 font-medium">Initial Status</p>
                <div className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full text-sm font-bold shadow-lg ${
                  previewInfo.status === 'Good' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/25' :
                  previewInfo.status === 'Low' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-yellow-500/25' :
                  'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/25'
                }`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{previewInfo.status}</span>
                </div>
              </div>

              {/* Visual Representation */}
              <div className="mb-6">
                <p className="text-sm text-violet-600 mb-3 font-medium">Stock Level Visualization:</p>
                <div className="relative">
                  <div className="w-full bg-gradient-to-r from-slate-200 to-slate-300 rounded-full h-8 shadow-inner">
                    <div
                      className={`h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg relative overflow-hidden ${
                        previewInfo.status === 'Good' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                        previewInfo.status === 'Low' ? 'bg-gradient-to-r from-yellow-500 to-amber-600' : 
                        'bg-gradient-to-r from-red-500 to-rose-600'
                      }`}
                      style={{ width: '100%' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                      <span className="relative z-10">{previewInfo.quantity} units</span>
                    </div>
                    {/* Threshold Marker */}
                    <div 
                      className="absolute top-0 w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full shadow-lg"
                      style={{ left: '50%' }}
                      title="50% Threshold Line"
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 mt-2 font-medium">
                    <span>0</span>
                    <span className="text-red-600 font-semibold">← Threshold: {previewInfo.threshold}</span>
                    <span>Base: {previewInfo.thresholdBase}</span>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-white/60 shadow-lg text-sm mb-4">
                <h4 className="font-bold text-slate-700 mb-3 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Status Information</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span><strong>Current Level:</strong> {previewInfo.percentageOfBase}% of threshold base</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span><strong>Units until Low Status:</strong> {previewInfo.unitsUntilLow} units</span>
                  </div>
                  <div className="flex items-center space-x-2 md:col-span-2">
                    <div className={`w-2 h-2 rounded-full ${previewInfo.isAboveThreshold ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span><strong>Threshold Status:</strong>
                      <span className={`ml-1 font-semibold ${previewInfo.isAboveThreshold ? 'text-green-600' : 'text-red-600'}`}>
                        {previewInfo.isAboveThreshold ? 'Above threshold ✓' : 'Below threshold ⚠️'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* How Dynamic Thresholds Work */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-white/60 shadow-lg text-sm">
                <h4 className="font-bold text-slate-700 mb-3 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>How Dynamic Thresholds Work</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600">
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span><strong>Good:</strong> Quantity is at or above 50% of the threshold base</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span><strong>Low:</strong> Quantity is below 50% of the threshold base</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span><strong>Critical:</strong> Quantity is 0 or below</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span><strong>Threshold Base:</strong> Updates to the new total quantity when you stock in</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span><strong>Smart Adjustment:</strong> When you stock in more items, the threshold base adjusts to prevent false alerts</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200/60">
                  <p className="text-xs text-slate-700">
                    <strong>Example:</strong> Add 200 units → Base: 200, Threshold: 100. When quantity drops below 100, status becomes "Low". This dynamic system adapts to your restocking patterns.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              className={`
                relative px-8 py-4 rounded-xl font-semibold text-white shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 min-w-[280px]
                ${loading || !quantity || !selectedItemId || !clinicId
                  ? 'bg-gradient-to-r from-slate-400 to-slate-500 cursor-not-allowed shadow-slate-500/20'
                  : 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/30 hover:shadow-green-600/40'
                }
              `}
              disabled={loading || !quantity || !selectedItemId || !clinicId}
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
              <div className={`flex items-center justify-center space-x-3 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>{loading ? "Processing..." : "Add to Clinic Inventory"}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6366f1, #8b5cf6);
          border-radius: 10px;
          border: 2px solid #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #4f46e5, #7c3aed);
        }
      `}</style>
    </div>
  );
}

export default AddClinicInventory;