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
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <div className="flex items-center justify-center">
          <div className="text-gray-600">Loading user information...</div>
        </div>
      </div>
    );
  }

  // Check if user has permission to add inventory
  const canAddInventory = userRole === "admin" || userRole === "superadmin" || clinicId;

  if (!canAddInventory) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4 text-red-600">Access Restricted</h2>
          <p className="text-gray-600">You don't have permission to add clinic inventory or no clinic affiliation found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-center">
        Add Clinic Inventory
      </h2>

      {/* Role-based clinic selection */}
      <label className="block text-sm font-medium mb-1">
        Clinic
        {(userRole === "admin" || userRole === "superadmin") && (
          <span className="text-blue-600 ml-1">(Select any clinic)</span>
        )}
      </label>
      
      {userRole === "admin" || userRole === "superadmin" ? (
        // Admin/Superadmin can select from all clinics
        <select
          value={clinicId}
          onChange={(e) => handleClinicChange(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        >
          <option value="">Select a clinic...</option>
          {availableClinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
      ) : (
        // Regular users see their assigned clinic (disabled)
        <select
          value={clinicId}
          disabled
          className="w-full p-2 mb-4 border rounded bg-gray-100 cursor-not-allowed"
        >
          <option value={clinicId}>{clinicName || "Loading..."}</option>
        </select>
      )}

      {/* Show selected clinic info for admins */}
      {(userRole === "admin" || userRole === "superadmin") && clinicId && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Selected Clinic:</strong> {clinicName}
            <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">
              {userRole === "superadmin" ? "Super Admin" : "Admin"} Access
            </span>
          </p>
        </div>
      )}

      {/* Searchable inventory input */}
      <label className="block text-sm font-medium mb-1">Inventory Item</label>
      <input
        list="inventory-options"
        placeholder="Type or select inventory item"
        className="w-full p-2 mb-4 border rounded"
        onChange={(e) => {
          const selected = inventoryItems.find(item => item.name === e.target.value);
          setSelectedItemId(selected ? selected.id : "");
        }}
      />
      <datalist id="inventory-options">
        {inventoryItems.map((item) => (
          <option key={item.id} value={item.name} />
        ))}
      </datalist>

      {/* Quantity input */}
      <label className="block text-sm font-medium mb-1">Initial Quantity</label>
      <input
        type="number"
        placeholder="Initial Quantity"
        className="w-full p-2 mb-4 border rounded"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        min="1"
      />

      {/* Enhanced Preview Section */}
      {previewInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-800 mb-3">Dynamic Threshold Preview</h3>
          
          {/* Main Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center bg-white rounded-lg p-3">
              <p className="text-sm text-blue-600">Initial Quantity</p>
              <p className="text-2xl font-bold text-blue-800">{previewInfo.quantity}</p>
              <p className="text-xs text-blue-500">units</p>
            </div>
            <div className="text-center bg-white rounded-lg p-3">
              <p className="text-sm text-blue-600">Threshold Base</p>
              <p className="text-2xl font-bold text-purple-600">{previewInfo.thresholdBase}</p>
              <p className="text-xs text-blue-500">baseline</p>
            </div>
            <div className="text-center bg-white rounded-lg p-3">
              <p className="text-sm text-blue-600">Low Stock Threshold</p>
              <p className="text-2xl font-bold text-orange-600">{previewInfo.threshold}</p>
              <p className="text-xs text-blue-500">50% of base</p>
            </div>
          </div>

          {/* Status Display */}
          <div className="text-center mb-4">
            <p className="text-sm text-blue-600 mb-2">Initial Status</p>
            <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
              previewInfo.status === 'Good' ? 'bg-green-100 text-green-800' :
              previewInfo.status === 'Low' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {previewInfo.status}
            </div>
          </div>

          {/* Visual Representation */}
          <div className="mb-4">
            <p className="text-sm text-blue-600 mb-2">Stock Level Visualization:</p>
            <div className="w-full bg-gray-200 rounded-full h-6 relative">
              <div
                className={`h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  previewInfo.status === 'Good' ? 'bg-green-500' :
                  previewInfo.status === 'Low' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: '100%' }}
              >
                {previewInfo.quantity} units
              </div>
              {/* Threshold Marker */}
              <div 
                className="absolute top-0 w-1 h-6 bg-red-500 opacity-70"
                style={{ left: '50%' }}
                title="50% Threshold Line"
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0</span>
              <span className="text-red-600 font-medium">← Threshold: {previewInfo.threshold}</span>
              <span>Base: {previewInfo.thresholdBase}</span>
            </div>
          </div>

          {/* Status Information */}
          <div className="bg-white rounded-lg p-3 border text-sm">
            <h4 className="font-medium text-gray-700 mb-2">Status Information:</h4>
            <div className="space-y-1 text-gray-600">
              <p><strong>Current Level:</strong> {previewInfo.percentageOfBase}% of threshold base</p>
              <p><strong>Units until Low Status:</strong> {previewInfo.unitsUntilLow} units</p>
              <p><strong>Threshold Status:</strong> 
                <span className={previewInfo.isAboveThreshold ? 'text-green-600' : 'text-red-600'}>
                  {previewInfo.isAboveThreshold ? ' Above threshold ✓' : ' Below threshold ⚠️'}
                </span>
              </p>
            </div>
          </div>

          {/* How Dynamic Thresholds Work */}
          <div className="mt-3 p-3 bg-white rounded border text-sm">
            <h4 className="font-medium text-gray-700 mb-1">How Dynamic Thresholds Work:</h4>
            <ul className="text-gray-600 space-y-1 text-xs">
              <li>• <strong>Good:</strong> Quantity is at or above 50% of the threshold base</li>
              <li>• <strong>Low:</strong> Quantity is below 50% of the threshold base</li>
              <li>• <strong>Critical:</strong> Quantity is 0 or below</li>
              <li>• <strong>Threshold Base:</strong> Updates to the new total quantity when you stock in</li>
              <li>• <strong>Example:</strong> Add 200 units → Base: 200, Threshold: 100. When quantity drops below 100, status becomes "Low"</li>
              <li>• When you stock in more items, the threshold base adjusts to the new total, preventing false alerts</li>
            </ul>
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded mt-4"
        disabled={loading || !quantity || !selectedItemId || !clinicId}
      >
        {loading ? "Saving..." : "Add to Clinic Inventory"}
      </button>
    </div>
  );
}

export default AddClinicInventory;