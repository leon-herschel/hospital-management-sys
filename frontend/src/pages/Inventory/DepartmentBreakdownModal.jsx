import React, { useState, useEffect } from 'react';
import { Building2, Package, Users, Calendar, User, MessageSquare, X } from 'lucide-react';

function DepartmentBreakdownModal({ item, onClose, inventoryNames, clinics }) {
  const [departmentData, setDepartmentData] = useState([]);
  const [totalTransferred, setTotalTransferred] = useState(0);
  const [remainingInMainStock, setRemainingInMainStock] = useState(0);

  useEffect(() => {
    if (!item) return;

    let departments = [];
    let transferred = 0;

    // Handle multiple department structure (departmentStock)
    if (item.departmentStock && typeof item.departmentStock === 'object') {
      departments = Object.entries(item.departmentStock)
        .filter(([dept, qty]) => dept !== 'timestamp' && dept !== 'transferredBy' && dept !== 'reason')
        .map(([department, quantity]) => ({
          department,
          quantity: Number(quantity) || 0,
          type: 'current'
        }));
      
      transferred = departments.reduce((sum, dept) => sum + dept.quantity, 0);
    }

    // Handle single department structure (deparmentStock - note the typo in your data)
    if (item.deparmentStock && typeof item.deparmentStock === 'object') {
      const singleDept = {
        department: item.deparmentStock.department || 'Unknown',
        quantity: Number(item.deparmentStock.quantity) || 0,
        reason: item.deparmentStock.reason || '',
        timestamp: item.deparmentStock.timestamp || '',
        transferredBy: item.deparmentStock.transferredBy || '',
        type: 'single'
      };
      departments.push(singleDept);
      transferred = singleDept.quantity;
    }

    const remaining = Math.max(0, (item.quantity || 0) - transferred);

    setDepartmentData(departments);
    setTotalTransferred(transferred);
    setRemainingInMainStock(remaining);
  }, [item]);

  if (!item) return null;

  const itemName = inventoryNames[item.itemId] || item.itemId;
  const clinicName = clinics[item.clinicId]?.name || item.clinicId;
  const thresholdBase = item.thresholdBase || item.quantity;
  const threshold = Math.floor(thresholdBase * 0.5);

  // Calculate status for main stock
  const calculateStatus = (quantity, thresholdBase) => {
    if (quantity <= 0) return 'Critical';
    const thresh = Math.floor(thresholdBase * 0.5);
    if (quantity < thresh) return 'Low';
    return 'Good';
  };

  const mainStockStatus = calculateStatus(remainingInMainStock, thresholdBase);
  const totalStockStatus = calculateStatus(item.quantity, thresholdBase);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Good': return 'text-green-600 bg-green-100';
      case 'Low': return 'text-yellow-600 bg-yellow-100';
      case 'Critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Department Stock Breakdown</h2>
                <p className="text-blue-100 mt-1">{itemName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Item Overview */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Clinic</p>
                <p className="font-semibold text-gray-800">{clinicName}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Stock</p>
                <p className="font-semibold text-gray-800">{item.quantity} units</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(totalStockStatus)}`}>
                  {totalStockStatus}
                </span>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Threshold Base</p>
                <p className="font-semibold text-gray-800">{thresholdBase} units</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Low Threshold</p>
                <p className="font-semibold text-gray-800">{threshold} units</p>
              </div>
            </div>
          </div>

          {/* Stock Distribution Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">Main Stock</h3>
              </div>
              <p className="text-2xl font-bold text-blue-600">{remainingInMainStock}</p>
              <p className="text-sm text-blue-600">units remaining</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(mainStockStatus)}`}>
                {mainStockStatus}
              </span>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-800">Transferred</h3>
              </div>
              <p className="text-2xl font-bold text-purple-600">{totalTransferred}</p>
              <p className="text-sm text-purple-600">units to departments</p>
              <p className="text-xs text-purple-500 mt-1">
                {departmentData.length} department{departmentData.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Distribution</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {totalTransferred > 0 ? ((totalTransferred / item.quantity) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-sm text-green-600">transferred out</p>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Stock Distribution Visualization</h3>
            <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
              {/* Main Stock */}
              <div
                className="absolute left-0 top-0 h-8 bg-blue-500 flex items-center justify-center text-white text-sm font-medium transition-all"
                style={{
                  width: `${item.quantity > 0 ? (remainingInMainStock / item.quantity) * 100 : 0}%`
                }}
                title={`Main Stock: ${remainingInMainStock} units`}
              >
                {remainingInMainStock > 0 && `${remainingInMainStock}`}
              </div>
              
              {/* Department Stocks */}
              {departmentData.map((dept, index) => {
                const previousWidth = departmentData
                  .slice(0, index)
                  .reduce((sum, d) => sum + d.quantity, 0);
                const leftPosition = item.quantity > 0 ? ((remainingInMainStock + previousWidth) / item.quantity) * 100 : 0;
                const width = item.quantity > 0 ? (dept.quantity / item.quantity) * 100 : 0;
                
                const colors = ['bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500'];
                const colorClass = colors[index % colors.length];
                
                return (
                  <div
                    key={`${dept.department}-${index}`}
                    className={`absolute top-0 h-8 ${colorClass} flex items-center justify-center text-white text-sm font-medium transition-all`}
                    style={{
                      left: `${leftPosition}%`,
                      width: `${width}%`
                    }}
                    title={`${dept.department}: ${dept.quantity} units`}
                  >
                    {width > 15 && `${dept.quantity}`}
                  </div>
                );
              })}
              
              {/* Threshold Marker */}
              <div 
                className="absolute top-0 w-1 h-8 bg-red-600 opacity-80 z-10"
                style={{ left: `${item.quantity > 0 ? (threshold / item.quantity) * 100 : 0}%` }}
                title={`Low Stock Threshold: ${threshold} units`}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>0</span>
              <span className="text-red-600">← Low Threshold: {threshold}</span>
              <span>Total: {item.quantity}</span>
            </div>
          </div>

          {/* Department Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 mb-3">Department Stock Details</h3>
            
            {departmentData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No stock has been transferred to departments yet.</p>
                <p className="text-sm">All {item.quantity} units remain in main stock.</p>
              </div>
            ) : (
              departmentData.map((dept, index) => {
                const percentage = item.quantity > 0 ? ((dept.quantity / item.quantity) * 100).toFixed(1) : 0;
                const colors = ['border-purple-200 bg-purple-50', 'border-green-200 bg-green-50', 'border-yellow-200 bg-yellow-50', 'border-red-200 bg-red-50', 'border-indigo-200 bg-indigo-50'];
                const colorClass = colors[index % colors.length];
                
                return (
                  <div key={`${dept.department}-${index}`} className={`border rounded-lg p-4 ${colorClass}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold text-gray-800">{dept.department}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-800">{dept.quantity}</p>
                        <p className="text-sm text-gray-600">units ({percentage}%)</p>
                      </div>
                    </div>
                    
                    {dept.type === 'single' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                        {dept.reason && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            <span><strong>Reason:</strong> {dept.reason}</span>
                          </div>
                        )}
                        {dept.transferredBy && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span><strong>By:</strong> {dept.transferredBy}</span>
                          </div>
                        )}
                        {dept.timestamp && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span><strong>When:</strong> {dept.timestamp}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Main Stock Details */}
          {remainingInMainStock > 0 && (
            <div className="mt-6">
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">Main Stock (Available)</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">{remainingInMainStock}</p>
                    <p className="text-sm text-blue-600">
                      units ({item.quantity > 0 ? ((remainingInMainStock / item.quantity) * 100).toFixed(1) : 0}%)
                    </p>
                  </div>
                </div>
                <p className="text-sm text-blue-600">
                  Available for transfer or direct use
                </p>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(mainStockStatus)}`}>
                    Status: {mainStockStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <p className="text-gray-600">Last Updated</p>
              <p className="font-semibold">{item.lastUpdated || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Departments</p>
              <p className="font-semibold">{departmentData.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Transfer Rate</p>
              <p className="font-semibold">
                {item.quantity > 0 ? ((totalTransferred / item.quantity) * 100).toFixed(0) : 0}%
              </p>
            </div>
            <div>
              <p className="text-gray-600">Remaining Rate</p>
              <p className="font-semibold">
                {item.quantity > 0 ? ((remainingInMainStock / item.quantity) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DepartmentBreakdownModal;