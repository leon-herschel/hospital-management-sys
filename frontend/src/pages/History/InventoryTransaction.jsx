import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import { getAuth } from "firebase/auth";
import AccessDenied from "../ErrorPages/AccessDenied";
import DateRangePicker from "../../components/DateRangePicker/DateRangePicker";

const InventoryTransaction = () => {
  const [transactionList, setTransactionList] = useState([]);
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const auth = getAuth();
  const user = auth.currentUser;

  // Fetch user's department, role, and clinic affiliation
  useEffect(() => {
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          setDepartment(userData.department);
          setRole(userData.role);
          setClinicId(userData.clinicAffiliation);
        }
      });
    }
  }, [user]);

  // Convert timestamp to a readable format
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Fetch inventory transactions based on role and clinic
  useEffect(() => {
    if (role) {
      const inventoryTransactionsRef = ref(database, "inventoryTransactions");
      onValue(inventoryTransactionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          let transactionData = Object.keys(data).map((key) => ({
            ...data[key],
            id: key,
          }));

          // Filter transactions based on role and clinic access
          if (role.toLowerCase() === "admin" || role.toLowerCase() === "superadmin") {
            // Admin/SuperAdmin: Show all transactions
            setTransactionList(transactionData);
          } else if (role.toLowerCase() === "manager") {
            // Manager: Show transactions for their clinic
            if (clinicId) {
              transactionData = transactionData.filter(
                (transaction) => transaction.clinicId === clinicId
              );
            }
            setTransactionList(transactionData);
          } else if (role.toLowerCase() === "staff" || role.toLowerCase() === "doctor") {
            // Staff/Doctor: Show transactions for their clinic and department
            if (clinicId) {
              transactionData = transactionData.filter(
                (transaction) => 
                  transaction.clinicId === clinicId &&
                  (transaction.sourceDepartment === department || 
                   transaction.destinationDepartment === department ||
                   transaction.processedByUserId === user.uid)
              );
            }
            setTransactionList(transactionData);
          } else {
            // Other roles: Show only their own transactions
            transactionData = transactionData.filter(
              (transaction) => transaction.processedByUserId === user.uid
            );
            setTransactionList(transactionData);
          }
        }
      });
    }
  }, [role, department, clinicId, user]);

  // Filter the transaction list based on the search term and date range
  const filteredTransactionList = transactionList.filter((transaction) => {
    const transactionTimestamp = new Date(transaction.timestamp);

    // Date filtering logic
    let withinDateRange = true;

    if (startDate && !endDate) {
      // Single day selection
      const startOfDay = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        0, 0, 0
      );
      const endOfDay = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        23, 59, 59
      );
      withinDateRange = transactionTimestamp >= startOfDay && transactionTimestamp <= endOfDay;
    } else if (startDate && endDate) {
      // Date range selection
      withinDateRange = transactionTimestamp >= startDate && transactionTimestamp <= endDate;
    }

    // Search term filtering
    const matchesSearchTerm =
      transaction.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.processedByUserFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.processedByUserLastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transactionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.sourceDepartment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.destinationDepartment?.toLowerCase().includes(searchTerm.toLowerCase());

    return withinDateRange && matchesSearchTerm;
  });

  // Get transaction type display text with styling
  const getTransactionTypeDisplay = (type, quantityChanged) => {
    const typeColors = {
      stock_in: "bg-green-100 text-green-800",
      usage: "bg-red-100 text-red-800",
      transfer_out: "bg-blue-100 text-blue-800",
      transfer_in: "bg-purple-100 text-purple-800",
      adjustment: "bg-yellow-100 text-yellow-800"
    };

    const typeLabels = {
      stock_in: "Stock In",
      usage: "Usage",
      transfer_out: "Transfer Out",
      transfer_in: "Transfer In",
      adjustment: "Adjustment"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
        {typeLabels[type] || type}
      </span>
    );
  };

  // Check if user has restricted access
  if (department === "CSR" || (role !== "admin" && role !== "superadmin" && role !== "manager" && role !== "staff" && role !== "doctor")) {
    return <AccessDenied />;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Transactions</h1>
        <p className="text-gray-600">View and track all inventory transaction history</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search transactions..."
          className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Transaction Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
          <p className="text-2xl font-bold text-gray-900">{filteredTransactionList.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Stock In</h3>
          <p className="text-2xl font-bold text-green-600">
            {filteredTransactionList.filter(t => t.transactionType === 'stock_in').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Usage</h3>
          <p className="text-2xl font-bold text-red-600">
            {filteredTransactionList.filter(t => t.transactionType === 'usage').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Transfers</h3>
          <p className="text-2xl font-bold text-blue-600">
            {filteredTransactionList.filter(t => t.transactionType === 'transfer_out' || t.transactionType === 'transfer_in').length}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-900">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Item & Type
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Processed By
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactionList.length > 0 ? (
                filteredTransactionList
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Sort by newest first
                  .map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {transaction.itemName || "Unknown Item"}
                          </span>
                          <div className="mt-1">
                            {getTransactionTypeDisplay(transaction.transactionType, transaction.quantityChanged)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${
                          transaction.quantityChanged > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.quantityChanged > 0 ? '+' : ''}{transaction.quantityChanged}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {`${transaction.processedByUserFirstName || 'Unknown'} ${transaction.processedByUserLastName || 'User'}`}
                          </span>
                          <span className="text-xs text-gray-500">
                            ID: {transaction.processedByUserId?.substring(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-sm">
                          {transaction.sourceDepartment && (
                            <span className="text-gray-600">
                              From: <span className="font-medium">{transaction.sourceDepartment}</span>
                            </span>
                          )}
                          {transaction.destinationDepartment && (
                            <span className="text-gray-600">
                              To: <span className="font-medium">{transaction.destinationDepartment}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{transaction.reason || "No reason provided"}</span>
                        {transaction.relatedPatientId && (
                          <div className="text-xs text-gray-500 mt-1">
                            Patient: {transaction.relatedPatientId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {transaction.timestamp ? formatTimestamp(transaction.timestamp) : "N/A"}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-1">No transactions found</p>
                      <p className="text-gray-500">Try adjusting your search criteria or date range</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer with transaction count */}
      {filteredTransactionList.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Showing {filteredTransactionList.length} transaction{filteredTransactionList.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default InventoryTransaction;