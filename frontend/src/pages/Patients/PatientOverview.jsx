import React from "react";
import {
  Package,
  TestTube,
  FileText,
} from "lucide-react";

function PatientOverviewTab({ 
  inventoryItems, 
  labTests, 
  prescriptionList, 
  formatTimestamp, 
  getTestName, 
  medicalServices 
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Item Usage</p>
              <p className="text-2xl font-bold text-blue-900">{inventoryItems.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Lab Tests</p>
              <p className="text-2xl font-bold text-green-900">{labTests.length}</p>
            </div>
            <TestTube className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Prescriptions</p>
              <p className="text-2xl font-bold text-purple-900">{prescriptionList.length}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[...inventoryItems.slice(0, 3), ...labTests.slice(0, 3)]
            .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt))
            .slice(0, 5)
            .map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {item.itemName ? <Package className="w-4 h-4 text-blue-600" /> : <TestTube className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item.itemName || getTestName(item.serviceId, item.serviceName)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(item.timestamp || item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default PatientOverviewTab;