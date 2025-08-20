import React, { useState, useEffect } from 'react';
import { ref, update, get, push } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { Plus, Package, TrendingUp } from 'lucide-react';

function ClinicStockIn({ item, onClose, currentUserId }) {
  const [stockInQuantity, setStockInQuantity] = useState(0);
  const [itemName, setItemName] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    // Fetch current user data from database
    const fetchUserData = async () => {
      console.log('Fetching user data for ID:', currentUserId);
      
      if (!currentUserId) {
        console.error('No currentUserId provided');
        setError('User ID is required');
        setUserLoading(false);
        return;
      }

      try {
        const userRef = ref(database, `users/${currentUserId}`);
        console.log('Database reference path:', `users/${currentUserId}`);
        
        const snapshot = await get(userRef);
        console.log('Snapshot exists:', snapshot.exists());
        console.log('Snapshot data:', snapshot.val());
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          console.log('User data retrieved:', userData);
          
          setCurrentUser({
            userId: currentUserId,
            firstName: userData.firstName || 'Unknown',
            lastName: userData.lastName || 'User',
            clinicAffiliation: userData.clinicAffiliation || null,
            email: userData.email || 'No email',
            role: userData.role || 'User',
            department: userData.department || userData.role || 'Unknown'
          });
        } else {
          console.error('User document does not exist for ID:', currentUserId);
          setError(`User data not found for ID: ${currentUserId}`);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(`Failed to fetch user data: ${error.message}`);
      } finally {
        setUserLoading(false);
      }
    };

    // Fetch item name from inventoryItems
    const fetchItemName = async () => {
      try {
        const itemRef = ref(database, `inventoryItems/${item.itemId}`);
        const snapshot = await get(itemRef);
        if (snapshot.exists()) {
          setItemName(snapshot.val().itemName || item.itemId);
        } else {
          setItemName(item.itemId);
        }
      } catch (error) {
        console.error('Error fetching item name:', error);
        setItemName(item.itemId);
      }
    };

    fetchUserData();
    fetchItemName();
  }, [item.itemId, currentUserId]);

  // Updated status determination using dynamic threshold
  const determineStatus = (quantity, thresholdBase) => {
    if (quantity <= 0) return 'Critical';
    
    const threshold = Math.floor(thresholdBase * 0.5);
    if (quantity < threshold) return 'Low';
    
    return 'Good';
  };

  // Function to create transaction record
  const createTransactionRecord = async (quantityAdded, newQuantity, newThresholdBase, oldStatus, newStatus) => {
    if (!currentUser) {
      throw new Error('User data not available');
    }

    try {
      // Determine clinic ID based on user role/department
      let transactionClinicId;
      if (currentUser.department === 'Admin' || currentUser.role === 'Admin') {
        transactionClinicId = item.clinicId;
      } else {
        transactionClinicId = currentUser.clinicAffiliation;
      }

      const transactionData = {
        clinicId: transactionClinicId,
        destinationDepartment: "Pharmacy",
        itemId: item.itemId,
        itemName: itemName,
        processedByUserFirstName: currentUser.firstName,
        processedByUserId: currentUser.userId,
        processedByUserLastName: currentUser.lastName,
        processedByUserDepartment: currentUser.department || currentUser.role,
        quantityChanged: quantityAdded,
        quantityBefore: item.quantity,
        quantityAfter: newQuantity,
        thresholdBaseBefore: item.thresholdBase || item.quantity, // fallback for legacy data
        thresholdBaseAfter: newThresholdBase,
        statusBefore: oldStatus,
        statusAfter: newStatus,
        reason: reason || "Stock replenishment",
        timestamp: new Date().toISOString(),
        transactionType: "stock_in",
        adminProcessed: currentUser.department === 'Admin' || currentUser.role === 'Admin'
      };

      const transactionsRef = ref(database, 'inventoryTransactions');
      await push(transactionsRef, transactionData);
      
      console.log('Transaction recorded successfully');
    } catch (error) {
      console.error('Error recording transaction:', error);
    }
  };

  // Updated handleSubmit function in ClinicStockIn.js
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (stockInQuantity <= 0) {
    setError('Please enter a valid quantity greater than 0.');
    return;
  }

  if (!currentUser) {
    setError('User data is not loaded. Please try again.');
    return;
  }

  // Check if user has permission to perform stock-in
  const isAdmin = currentUser.department === 'Admin' || currentUser.role === 'Admin';
  const hasClinicAffiliation = currentUser.clinicAffiliation;
  
  if (!isAdmin && !hasClinicAffiliation) {
    setError('You do not have permission to perform stock operations. Contact your administrator.');
    return;
  }

  // For non-admin users, ensure they can only stock items from their affiliated clinic
  if (!isAdmin && currentUser.clinicAffiliation !== item.clinicId) {
    setError('You can only stock items for your affiliated clinic.');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const newQuantity = item.quantity + stockInQuantity;
    
    // CRITICAL: Update thresholdBase to the new total quantity after stock-in
    const newThresholdBase = newQuantity;
    
    // Calculate status for transaction record and display only
    const oldStatus = determineStatus(item.quantity, item.thresholdBase || item.quantity);
    const newStatus = determineStatus(newQuantity, newThresholdBase);
    
    const updatedData = {
      quantity: newQuantity,
      thresholdBase: newThresholdBase, // This is the key change - update threshold base
      lastUpdated: new Date().toISOString().split('T')[0],
      // REMOVED: status field - calculate dynamically instead
      currentThreshold: Math.floor(newThresholdBase * 0.5) // Store current 50% threshold for reference
    };

    // Update the inventory stock
    const clinicInventoryRef = ref(database, `clinicInventoryStock/${item.clinicId}/${item.itemId}`);
    await update(clinicInventoryRef, updatedData);

    // Create transaction record with detailed threshold information
    await createTransactionRecord(stockInQuantity, newQuantity, newThresholdBase, oldStatus, newStatus);

    alert(
      `Successfully added ${stockInQuantity} units to inventory!\n` +
      `New Total: ${newQuantity} units\n` +
      `New Threshold Base: ${newThresholdBase}\n` +
      `New Low Stock Threshold: ${Math.floor(newThresholdBase * 0.5)} units\n` +
      `Status: ${oldStatus} → ${newStatus}`
    );
    onClose();
  } catch (error) {
    console.error('Error updating stock:', error);
    setError('Failed to update stock. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // Calculate preview values with new dynamic threshold logic
  const getStockInPreview = () => {
    if (stockInQuantity <= 0) return null;
    
    const newQuantity = item.quantity + stockInQuantity;
    const currentThresholdBase = item.thresholdBase || item.quantity; // fallback for legacy data
    const newThresholdBase = newQuantity; // New threshold base becomes the new total
    const currentThreshold = Math.floor(currentThresholdBase * 0.5);
    const newThreshold = Math.floor(newThresholdBase * 0.5);
    const currentStatus = item.status;
    const newStatus = determineStatus(newQuantity, newThresholdBase);
    
    return {
      currentQuantity: item.quantity,
      addingQuantity: stockInQuantity,
      newQuantity,
      currentThresholdBase,
      newThresholdBase,
      currentThreshold,
      newThreshold,
      currentStatus,
      newStatus,
      thresholdBaseChanged: currentThresholdBase !== newThresholdBase,
      statusChanged: currentStatus !== newStatus
    };
  };

  const preview = getStockInPreview();

  // Show loading state if user data is still being fetched
  if (userLoading) {
    return (
      <div className="w-full flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
        <span className="ml-2">Loading user data...</span>
      </div>
    );
  }

  // Show error if user data couldn't be loaded
  if (!currentUser && !userLoading) {
    return (
      <div className="w-full p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <div className="font-medium mb-2">Failed to load user data</div>
          <div className="text-sm space-y-1">
            <p><strong>User ID:</strong> {currentUserId || 'Not provided'}</p>
            <p><strong>Error:</strong> {error}</p>
            <p className="text-red-600 mt-2">Please check:</p>
            <ul className="list-disc list-inside text-sm">
              <li>User ID is correctly passed to the component</li>
              <li>User exists in Firebase database under path: users/{currentUserId}</li>
              <li>Database permissions allow reading user data</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check user permissions
  const isAdmin = currentUser?.department === 'Admin' || currentUser?.role === 'Admin';

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-green-500" />
        <h2 className="text-2xl font-bold text-gray-800">Stock In Inventory</h2>
      </div>
      <div className="overflow-y-auto max-h-[70vh] pr-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Admin Permission Notice */}
          {isAdmin && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span className="font-medium">Admin Access:</span>
              </div>
              <p className="text-sm mt-1">
                You are performing this operation with administrative privileges for clinic: {item.clinicId}
              </p>
            </div>
          )}

          {/* Current Item Information Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Current Item Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Item Name</label>
                <p className="text-gray-900 font-medium">{itemName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Clinic ID</label>
                <p className="text-gray-900 font-medium">{item.clinicId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Current Quantity</label>
                <p className="text-gray-900 font-medium">{item.quantity} units</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Threshold Base</label>
                <p className="text-gray-900 font-medium">{item.thresholdBase || item.quantity} units</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Current Low Threshold</label>
                <p className="text-gray-900 font-medium">{Math.floor((item.thresholdBase || item.quantity) * 0.5)} units (50%)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Current Status</label>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === 'Good' ? 'bg-green-100 text-green-800' :
                  item.status === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.status}
                </span>
              </div>
            </div>
          </div>

          {/* Stock In Form */}
          <div>
            <label htmlFor="stockInQuantity" className="block text-sm font-medium text-gray-700 mb-2">
              Quantity to Add *
            </label>
            <input
              type="number"
              id="stockInQuantity"
              value={stockInQuantity}
              onChange={(e) => setStockInQuantity(parseInt(e.target.value) || 0)}
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter quantity to add"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the number of units you want to add to the current stock.
            </p>
          </div>

          {/* Reason Field */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <input
              type="text"
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Stock replenishment, Emergency restock, etc."
            />
            <p className="text-sm text-gray-500 mt-1">
              Provide a reason for this stock-in operation (optional).
            </p>
          </div>

          {/* User Information Display */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-700 mb-2">Processed By</h3>
            <div className="text-blue-900">
              <p className="font-medium">{currentUser.firstName} {currentUser.lastName}</p>
              <p className="text-sm text-blue-600">User ID: {currentUser.userId}</p>
              <p className="text-sm text-blue-600">Role: {currentUser.role}</p>
              <p className="text-sm text-blue-600">Department: {currentUser.department || 'Not specified'}</p>
              <p className="text-sm text-blue-600">Email: {currentUser.email}</p>
              {isAdmin ? (
                <p className="text-sm text-blue-600">
                  <span className="font-medium">Access Level:</span> Administrative (Can manage all clinics)
                </p>
              ) : (
                <p className="text-sm text-blue-600">
                  <span className="font-medium">Clinic Affiliation:</span> {currentUser.clinicAffiliation || 'None'}
                </p>
              )}
            </div>
          </div>

          {/* Enhanced Preview of Changes with Dynamic Threshold Logic */}
          {preview && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Stock Update Preview - Dynamic Threshold System
              </h3>
              
              {/* Quantity Changes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Current Stock</p>
                  <p className="text-xl font-bold text-gray-800">{preview.currentQuantity}</p>
                  <p className="text-xs text-gray-500">{preview.currentStatus}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Adding</p>
                  <p className="text-xl font-bold text-green-600">+{preview.addingQuantity}</p>
                  <p className="text-xs text-green-500">units</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">New Stock</p>
                  <p className="text-xl font-bold text-blue-600">{preview.newQuantity}</p>
                  <p className={`text-xs font-medium ${
                    preview.newStatus === 'Good' ? 'text-green-500' :
                    preview.newStatus === 'Low' ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {preview.newStatus}
                  </p>
                </div>
              </div>

              {/* Threshold Changes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-700 mb-2">Current Thresholds</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Threshold Base:</strong> {preview.currentThresholdBase} units</p>
                    <p><strong>Low Stock Threshold:</strong> {preview.currentThreshold} units (50%)</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-1 ${
                        preview.currentStatus === 'Good' ? 'text-green-600' :
                        preview.currentStatus === 'Low' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {preview.currentStatus}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-700 mb-2">New Thresholds</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Threshold Base:</strong> 
                      <span className={preview.thresholdBaseChanged ? 'text-blue-600 font-medium' : ''}>
                        {preview.newThresholdBase} units
                      </span>
                      {preview.thresholdBaseChanged && <span className="text-blue-500 text-xs ml-1">↑ Updated</span>}
                    </p>
                    <p><strong>Low Stock Threshold:</strong> 
                      <span className={preview.thresholdBaseChanged ? 'text-blue-600 font-medium' : ''}>
                        {preview.newThreshold} units (50%)
                      </span>
                      {preview.thresholdBaseChanged && <span className="text-blue-500 text-xs ml-1">↑ Updated</span>}
                    </p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-1 ${
                        preview.newStatus === 'Good' ? 'text-green-600' :
                        preview.newStatus === 'Low' ? 'text-yellow-600' :
                        'text-red-600'
                      } ${preview.statusChanged ? 'font-medium' : ''}`}>
                        {preview.newStatus}
                      </span>
                      {preview.statusChanged && <span className="text-blue-500 text-xs ml-1">↑ Changed</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">Stock Level After Update:</p>
                <div className="w-full bg-gray-200 rounded-full h-6 relative">
                  <div
                    className={`h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      preview.newStatus === 'Good' ? 'bg-green-500' :
                      preview.newStatus === 'Low' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((preview.newQuantity / preview.newThresholdBase) * 100, 100)}%` }}
                  >
                    {preview.newQuantity}
                  </div>
                  {/* New Threshold Marker */}
                  <div 
                    className="absolute top-0 w-1 h-6 bg-red-600 opacity-80"
                    style={{ left: '50%' }}
                    title={`New Low Stock Threshold: ${preview.newThreshold} units`}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0</span>
                  <span className="text-red-600 font-medium">← New Threshold: {preview.newThreshold}</span>
                  <span>New Base: {preview.newThresholdBase}</span>
                </div>
              </div>

              {/* Status Changes Alert */}
              {preview.statusChanged && (
                <div className="mb-3 p-2 bg-blue-100 rounded text-sm text-blue-700">
                  <strong>Status Change:</strong> {preview.currentStatus} → {preview.newStatus}
                </div>
              )}

              {/* Threshold Base Change Alert */}
              {preview.thresholdBaseChanged && (
                <div className="mb-3 p-2 bg-purple-100 rounded text-sm text-purple-700">
                  <strong>Threshold Base Updated:</strong> {preview.currentThresholdBase} → {preview.newThresholdBase} units
                  <br />
                  <span className="text-xs">The low stock threshold will now be calculated from the new base ({preview.newThreshold} units)</span>
                </div>
              )}

              {/* Transaction Preview */}
              <div className="mt-4 p-3 bg-white rounded border">
                <h4 className="font-medium text-gray-700 mb-2">Transaction Details</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Type:</strong> Stock In</p>
                  <p><strong>Quantity Changed:</strong> +{preview.addingQuantity}</p>
                  <p><strong>Quantity Before:</strong> {preview.currentQuantity}</p>
                  <p><strong>Quantity After:</strong> {preview.newQuantity}</p>
                  <p><strong>Threshold Base Before:</strong> {preview.currentThresholdBase}</p>
                  <p><strong>Threshold Base After:</strong> {preview.newThresholdBase}</p>
                  <p><strong>Status Before:</strong> {preview.currentStatus}</p>
                  <p><strong>Status After:</strong> {preview.newStatus}</p>
                  <p><strong>Reason:</strong> {reason || "Stock replenishment"}</p>
                  <p><strong>Target Clinic:</strong> {item.clinicId}</p>
                  <p><strong>Destination:</strong> Pharmacy</p>
                  <p><strong>Processed By:</strong> {currentUser.firstName} {currentUser.lastName}</p>
                  <p><strong>Processing Authority:</strong> {isAdmin ? 'Administrative Access' : 'Clinic Affiliation'}</p>
                </div>
              </div>

              {/* Dynamic Threshold Explanation */}
              <div className="mt-4 p-3 bg-white rounded border text-sm">
                <h4 className="font-medium text-gray-700 mb-1">How This Update Works:</h4>
                <ul className="text-gray-600 space-y-1 text-xs">
                  <li>• Your stock will increase from <strong>{preview.currentQuantity}</strong> to <strong>{preview.newQuantity}</strong> units</li>
                  <li>• The threshold base will update from <strong>{preview.currentThresholdBase}</strong> to <strong>{preview.newThresholdBase}</strong></li>
                  <li>• The low stock threshold will change from <strong>{preview.currentThreshold}</strong> to <strong>{preview.newThreshold}</strong> units</li>
                  <li>• Future "Low" status will trigger when stock drops below <strong>{preview.newThreshold}</strong> units</li>
                  <li>• This prevents false low-stock alerts when you increase inventory capacity</li>
                </ul>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading || stockInQuantity <= 0}
              className="flex-1 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add to Stock
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 flex items-center justify-center gap-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClinicStockIn;