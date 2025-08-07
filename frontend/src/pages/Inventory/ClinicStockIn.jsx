import React, { useState, useEffect } from 'react';
import { ref, update, get, push } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { Plus, Package, TrendingUp } from 'lucide-react';
// You'll need to import your auth context or hook here
// import { useAuth } from '../../context/AuthContext'; // Example

function ClinicStockIn({ item, onClose, currentUserId }) {
  const [stockInQuantity, setStockInQuantity] = useState(0);
  const [itemName, setItemName] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // If you're using auth context, you can get the user ID like this:
  // const { currentUser } = useAuth(); // Then use currentUser.uid

  useEffect(() => {
    // Fetch current user data from database
    const fetchUserData = async () => {
      console.log('Fetching user data for ID:', currentUserId); // Debug log
      
      if (!currentUserId) {
        console.error('No currentUserId provided'); // Debug log
        setError('User ID is required');
        setUserLoading(false);
        return;
      }

      try {
        const userRef = ref(database, `users/${currentUserId}`);
        console.log('Database reference path:', `users/${currentUserId}`); // Debug log
        
        const snapshot = await get(userRef);
        console.log('Snapshot exists:', snapshot.exists()); // Debug log
        console.log('Snapshot data:', snapshot.val()); // Debug log
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          console.log('User data retrieved:', userData); // Debug log
          
          setCurrentUser({
            userId: currentUserId,
            firstName: userData.firstName || 'Unknown',
            lastName: userData.lastName || 'User',
            clinicAffiliation: userData.clinicAffiliation || null,
            email: userData.email || 'No email',
            role: userData.role || 'User',
            department: userData.department || userData.role || 'Unknown' // Fallback to role if department not found
          });
        } else {
          console.error('User document does not exist for ID:', currentUserId); // Debug log
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

  const determineStatus = (quantity) => {
    if (quantity <= 0) return 'Critical';
    if (quantity <= 20) return 'Low Stock';
    return 'In Stock';
  };

  // Function to create transaction record
  const createTransactionRecord = async (quantityAdded) => {
    if (!currentUser) {
      throw new Error('User data not available');
    }

    try {
      // Determine clinic ID based on user role/department
      let transactionClinicId;
      if (currentUser.department === 'Admin' || currentUser.role === 'Admin') {
        // For Admin users, use the clinic ID from the item being stocked
        transactionClinicId = item.clinicId;
      } else {
        // For regular users, use their clinic affiliation
        transactionClinicId = currentUser.clinicAffiliation;
      }

      const transactionData = {
        clinicId: transactionClinicId,
        destinationDepartment: "Pharmacy", // You might want to make this dynamic
        itemId: item.itemId,
        itemName: itemName,
        processedByUserFirstName: currentUser.firstName,
        processedByUserId: currentUser.userId,
        processedByUserLastName: currentUser.lastName,
        processedByUserDepartment: currentUser.department || currentUser.role, // Include user department/role
        quantityChanged: quantityAdded,
        reason: reason || "Stock replenishment",
        timestamp: new Date().toISOString(),
        transactionType: "stock_in",
        // Add a flag to indicate if this was processed by admin
        adminProcessed: currentUser.department === 'Admin' || currentUser.role === 'Admin'
      };

      // Push to a transactions node in your database
      const transactionsRef = ref(database, 'inventoryTransactions');
      await push(transactionsRef, transactionData);
      
      console.log('Transaction recorded successfully');
    } catch (error) {
      console.error('Error recording transaction:', error);
      // Don't throw error here to avoid blocking the stock update
    }
  };

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
      const updatedData = {
        quantity: newQuantity,
        status: determineStatus(newQuantity),
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      // Update the inventory stock
      const clinicInventoryRef = ref(database, `clinicInventoryStock/${item.clinicId}/${item.itemId}`);
      await update(clinicInventoryRef, updatedData);

      // Create transaction record
      await createTransactionRecord(stockInQuantity);

      alert(`Successfully added ${stockInQuantity} units to inventory!`);
      onClose();
    } catch (error) {
      console.error('Error updating stock:', error);
      setError('Failed to update stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const newQuantity = item.quantity + stockInQuantity;
  const newStatus = determineStatus(newQuantity);

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
  const hasClinicAffiliation = currentUser?.clinicAffiliation;

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

        {/* Item Information Display */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Item Information</h3>
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
              <label className="block text-sm font-medium text-gray-600">Current Status</label>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
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

        {/* Preview of Changes */}
        {stockInQuantity > 0 && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Stock Update Preview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Current Stock</p>
                <p className="text-xl font-bold text-gray-800">{item.quantity}</p>
                <p className="text-xs text-gray-500">{item.status}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Adding</p>
                <p className="text-xl font-bold text-green-600">+{stockInQuantity}</p>
                <p className="text-xs text-green-500">units</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">New Stock</p>
                <p className="text-xl font-bold text-blue-600">{newQuantity}</p>
                <p className={`text-xs font-medium ${
                  newStatus === 'In Stock' ? 'text-green-500' :
                  newStatus === 'Low Stock' ? 'text-yellow-500' :
                  'text-red-500'
                }`}>
                  {newStatus}
                </p>
              </div>
            </div>
            
            {item.status !== newStatus && (
              <div className="mt-3 p-2 bg-blue-100 rounded text-sm text-blue-700">
                <strong>Status Change:</strong> {item.status} → {newStatus}
              </div>
            )}

            {/* Transaction Preview */}
            <div className="mt-4 p-3 bg-white rounded border">
              <h4 className="font-medium text-gray-700 mb-2">Transaction Details</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Type:</strong> Stock In</p>
                <p><strong>Quantity Changed:</strong> +{stockInQuantity}</p>
                <p><strong>Reason:</strong> {reason || "Stock replenishment"}</p>
                <p><strong>Target Clinic:</strong> {item.clinicId}</p>
                <p><strong>Destination:</strong> Pharmacy</p>
                <p><strong>Processed By:</strong> {currentUser.firstName} {currentUser.lastName}</p>
                <p><strong>Processing Authority:</strong> {isAdmin ? 'Administrative Access' : 'Clinic Affiliation'}</p>
              </div>
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