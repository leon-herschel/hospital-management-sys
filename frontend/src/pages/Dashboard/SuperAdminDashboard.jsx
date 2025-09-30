import { useState, useEffect } from "react";
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Activity,
  MapPin,
  DollarSign,
  AlertTriangle,
  BarChart3,
  Eye,
  ArrowRight,
  Bell
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const [clinics, setClinics] = useState({});
  const [aggregatedStats, setAggregatedStats] = useState({
    totalClinics: 0,
    totalPatients: 0,
    totalRevenue: 0,
    totalLowStockItems: 0,
    activeClinics: 0,
    totalStaff: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [clinicPerformance, setClinicPerformance] = useState([]);

  useEffect(() => {
    const fetchAllClinicsData = async () => {
      const allNotifications = [];
      const performanceData = [];
      
      // Fetch clinics data
      const clinicsRef = ref(database, 'clinics');
      onValue(clinicsRef, (snapshot) => {
        const clinicsData = snapshot.val() || {};
        setClinics(clinicsData);
        
        const stats = {
          totalClinics: Object.keys(clinicsData).length,
          activeClinics: Object.values(clinicsData).filter(clinic => clinic.status === 'active').length,
          totalPatients: 0,
          totalRevenue: 0,
          totalLowStockItems: 0,
          totalStaff: 0
        };

        // Process each clinic
        Object.entries(clinicsData).forEach(([clinicId, clinic]) => {
          processClinicData(clinicId, clinic, stats, allNotifications, performanceData);
        });

        setAggregatedStats(stats);
        setClinicPerformance(performanceData);
        
        // Sort notifications by priority and timestamp
        allNotifications.sort((a, b) => {
          if (a.priority !== b.priority) {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        setNotifications(allNotifications);
      });
    };

    fetchAllClinicsData();

    // Refresh data every 60 seconds for SuperAdmin
    const interval = setInterval(fetchAllClinicsData, 60000);
    return () => clearInterval(interval);
  }, []);

  const processClinicData = (clinicId, clinic, stats, notifications, performanceData) => {
    let clinicRevenue = 0;
    let clinicPatients = 0;
    let clinicLowStock = 0;

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process patients for this clinic
    const patientsRef = ref(database, `clinicData/${clinicId}/patients`);
    onValue(patientsRef, (snapshot) => {
      const patientsData = snapshot.val() || {};
      Object.values(patientsData).forEach(patient => {
        const patientDate = new Date(patient.dateTime);
        patientDate.setHours(0, 0, 0, 0);
        
        if (patientDate.getTime() === today.getTime()) {
          clinicPatients++;
        }
      });
      stats.totalPatients += clinicPatients;
    });

    // Process revenue for this clinic
    const billingRef = ref(database, `clinicData/${clinicId}/clinicBilling`);
    onValue(billingRef, (snapshot) => {
      const billingData = snapshot.val() || {};
      Object.values(billingData).forEach(billing => {
        if (billing.status === 'paid' && billing.dateTime) {
          const billingDate = new Date(billing.dateTime);
          billingDate.setHours(0, 0, 0, 0);
          
          if (billingDate.getTime() === today.getTime()) {
            clinicRevenue += parseFloat(billing.totalAmount || 0);
          }
        }
      });
      stats.totalRevenue += clinicRevenue;
    });

    // Process inventory for this clinic
    const inventoryRef = ref(database, `clinicData/${clinicId}/inventoryItems`);
    onValue(inventoryRef, (snapshot) => {
      const inventoryData = snapshot.val() || {};
      Object.entries(inventoryData).forEach(([itemId, item]) => {
        const quantity = item.quantity || 0;
        const minQuantity = item.minQuantity || 10;
        
        if (quantity <= minQuantity) {
          clinicLowStock++;
          
          // Add critical stock notifications
          if (quantity === 0) {
            notifications.push({
              id: `${clinicId}-stock-${itemId}`,
              type: 'inventory',
              priority: 'high',
              title: 'Critical Stock Alert',
              message: `${clinic.name || clinicId}: ${item.itemName} is out of stock`,
              timestamp: new Date().toISOString(),
              category: 'Multi-Clinic Inventory',
              clinicId: clinicId,
              clinicName: clinic.name || clinicId
            });
          }
        }
      });
      stats.totalLowStockItems += clinicLowStock;
    });

    // Process staff for this clinic
    const staffRef = ref(database, `clinicData/${clinicId}/staff`);
    onValue(staffRef, (snapshot) => {
      const staffData = snapshot.val() || {};
      const staffCount = Object.keys(staffData).length;
      stats.totalStaff += staffCount;
    });

    // Add clinic performance data
    performanceData.push({
      id: clinicId,
      name: clinic.name || clinicId,
      location: clinic.location || 'Unknown',
      status: clinic.status || 'unknown',
      patientsToday: clinicPatients,
      revenueToday: clinicRevenue,
      lowStockItems: clinicLowStock,
      lastActive: clinic.lastActive || 'Unknown'
    });

    // Check for clinic-specific issues
    if (clinic.status !== 'active') {
      notifications.push({
        id: `clinic-inactive-${clinicId}`,
        type: 'system',
        priority: 'high',
        title: 'Clinic Inactive',
        message: `${clinic.name || clinicId} is currently ${clinic.status}`,
        timestamp: new Date().toISOString(),
        category: 'System Status',
        clinicId: clinicId,
        clinicName: clinic.name || clinicId
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">SuperAdmin Dashboard</h1>
        <p className="text-gray-600 mt-2">Multi-clinic overview and management</p>
      </div>

      {/* Network Overview Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Network Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clinics</p>
                <p className="text-2xl font-bold text-indigo-600">{aggregatedStats.totalClinics}</p>
              </div>
              <Building2 className="h-8 w-8 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Clinics</p>
                <p className="text-2xl font-bold text-green-600">{aggregatedStats.activeClinics}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-blue-600">{aggregatedStats.totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(aggregatedStats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600">{aggregatedStats.totalLowStockItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-purple-600">{aggregatedStats.totalStaff}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Clinic Performance */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Clinic Performance</h2>
          <BarChart3 className="h-5 w-5 text-gray-500" />
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clinic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patients Today
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue Today
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Low Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clinicPerformance.map((clinic) => (
                  <tr key={clinic.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{clinic.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {clinic.location}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        clinic.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {clinic.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {clinic.patientsToday}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(clinic.revenueToday)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        clinic.lowStockItems > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {clinic.lowStockItems}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="flex items-center text-indigo-600 hover:text-indigo-900">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Multi-Clinic Alerts */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Multi-Clinic Alerts
          </h2>
          <span className="bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded-full">
            {notifications.length} Active
          </span>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">All Systems Normal</p>
              <p>No critical alerts across all clinics.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 border-l-4 ${getPriorityColor(notification.priority)} hover:bg-gray-50 transition-colors duration-200`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(notification.priority)}`}>
                          {notification.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{notification.category}</span>
                        {notification.clinicName && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {notification.clinicName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                        <span>Investigate</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {notifications.length > 10 && (
                <div className="p-4 text-center">
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    View All {notifications.length} Alerts
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Network Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <button className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 text-left">
            <Building2 className="h-8 w-8 text-blue-500 mb-3" />
            <h3 className="font-semibold text-gray-900">Add New Clinic</h3>
            <p className="text-sm text-gray-600">Expand network</p>
          </button>
          
          <button className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 text-left">
            <Users className="h-8 w-8 text-green-500 mb-3" />
            <h3 className="font-semibold text-gray-900">Manage Staff</h3>
            <p className="text-sm text-gray-600">Network-wide staff</p>
          </button>
          
          <button className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 text-left">
            <BarChart3 className="h-8 w-8 text-purple-500 mb-3" />
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600">Network performance</p>
          </button>

          <button className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 text-left">
            <TrendingUp className="h-8 w-8 text-orange-500 mb-3" />
            <h3 className="font-semibold text-gray-900">Reports</h3>
            <p className="text-sm text-gray-600">Multi-clinic reports</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;