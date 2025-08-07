import { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Users, 
  Clock, 
  FileText, 
  AlertTriangle,
  TrendingUp,
  Activity,
  MessageSquare,
  ArrowRight,
  Bell
} from 'lucide-react';

const Dashboard = () => {
  const [notifications, setNotifications] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [stats, setStats] = useState({
    lowStockCount: 0,
    newPatientCount: 0,
    laboratoryCount: 0,
    salesToday: 0,
    pendingReferrals: 0,
    upcomingAppointments: 0,
    pendingPrescriptions: 0,
    unreadFeedback: 0
  });

  // Utility function to calculate stock status
  const calculateStatus = (quantity, maxQuantity) => {
    const ratio = quantity / maxQuantity;
    if (ratio <= 0.1) return "Very Low";
    if (ratio <= 0.25) return "Low Stock";
    if (ratio <= 0.5) return "Medium";
    return "Good";
  };

  // Mock Firebase-like database
  const mockDatabase = {
    users: {
      'user1': { department: 'Admin' }
    },
    inventoryItems: {
      'item1': { itemName: 'Bandages', quantity: 5, minQuantity: 20 },
      'item2': { itemName: 'Syringes', quantity: 0, minQuantity: 50 },
      'item3': { itemName: 'Aspirin', quantity: 15, minQuantity: 30 },
      'item4': { itemName: 'Gloves', quantity: 2, minQuantity: 100 }
    },
    patients: {
      'pat1': { 
        name: 'John Doe', 
        roomType: 'General',
        dateTime: Date.now() - (2 * 60 * 60 * 1000),
        services: [{ type: 'Laboratory', cost: 500 }]
      },
      'pat2': { 
        name: 'Jane Smith', 
        roomType: 'Laboratory',
        dateTime: Date.now() - (1 * 60 * 60 * 1000),
        totalBill: 1200
      }
    },
    referrals: {
      'ref1': { patientName: 'John Doe', status: 'pending', dateCreated: Date.now() - (2 * 24 * 60 * 60 * 1000) },
      'ref2': { patientName: 'Jane Smith', status: 'pending', dateCreated: Date.now() - (5 * 24 * 60 * 60 * 1000) },
      'ref3': { patientName: 'Bob Johnson', status: 'pending', dateCreated: Date.now() - (1 * 24 * 60 * 60 * 1000) }
    },
    schedules: {
      'sched1': { 
        patientName: 'Bob Johnson', 
        department: 'Admin',
        dateTime: Date.now() + (30 * 60 * 1000)
      },
      'sched2': { 
        patientName: 'Alice Brown', 
        department: 'Admin',
        dateTime: Date.now() + (45 * 60 * 1000)
      }
    },
    patientPrescription: {
      'presc1': { 
        patientName: 'Alice Brown', 
        status: 'pending', 
        dateCreated: Date.now() - (26 * 60 * 60 * 1000)
      },
      'presc2': { 
        patientName: 'Charlie Wilson', 
        status: 'pending', 
        dateCreated: Date.now() - (10 * 60 * 60 * 1000)
      }
    },
    feedback: {
      'feed1': { 
        rating: 1, 
        message: 'Very poor service, long waiting times', 
        reviewed: false, 
        timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000) 
      },
      'feed2': { 
        rating: 2, 
        message: 'Staff was rude and unprofessional', 
        reviewed: false, 
        timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000) 
      }
    },
    transactions: {
      'trans1': { amount: 2500, dateTime: Date.now() - (1 * 60 * 60 * 1000) },
      'trans2': { amount: 1800, dateTime: Date.now() - (3 * 60 * 60 * 1000) }
    }
  };

  useEffect(() => {
    setUserRole('Admin');
  }, []);

  useEffect(() => {
    if (!userRole) return;

    const fetchDashboardData = async () => {
      const allNotifications = [];
      const newStats = { ...stats };

      // Calculate all stats and notifications
      await calculateInventoryData(allNotifications, newStats);
      await calculatePatientData(newStats);
      await calculateReferralData(allNotifications, newStats);
      await calculateScheduleData(allNotifications, newStats);
      await calculatePrescriptionData(allNotifications, newStats);
      await calculateFeedbackData(allNotifications, newStats);
      await calculateSalesData(newStats);

      // Sort notifications by priority and timestamp
      allNotifications.sort((a, b) => {
        if (a.priority !== b.priority) {
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      setNotifications(allNotifications);
      setStats(newStats);
    };

    const calculateInventoryData = async (notifications, newStats) => {
      if (userRole === "Admin" || userRole === "CSR" || userRole === "Pharmacy") {
        const inventoryData = mockDatabase.inventoryItems;
        let lowStockCount = 0;

        if (inventoryData) {
          Object.entries(inventoryData).forEach(([key, item]) => {
            const quantity = item.quantity || 0;
            const minQuantity = item.minQuantity || 10;
            
            if (quantity <= minQuantity) {
              lowStockCount++;
              notifications.push({
                id: `inventory-${key}`,
                type: 'inventory',
                priority: quantity === 0 ? 'high' : 'medium',
                title: quantity === 0 ? 'Out of Stock' : 'Low Stock Alert',
                message: `${item.itemName}: ${quantity} remaining (min: ${minQuantity})`,
                timestamp: new Date().toISOString(),
                category: 'Inventory',
                actionUrl: '/inventory'
              });
            }
          });
        }
        newStats.lowStockCount = lowStockCount;
      }
    };

    const calculatePatientData = async (newStats) => {
      const patientsData = mockDatabase.patients;
      let newPatientCount = 0;
      let laboratoryCount = 0;

      if (patientsData) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        Object.entries(patientsData).forEach(([key, patient]) => {
          const patientTimestamp = patient.dateTime;
          const patientDate = new Date(patientTimestamp);
          patientDate.setHours(0, 0, 0, 0);

          if (patientDate.getTime() === today.getTime()) {
            if (userRole === "Admin" || userRole === patient.roomType) {
              newPatientCount++;
              
              if (patient.roomType === "Laboratory" || 
                  (patient.services && patient.services.some(s => s.type === "Laboratory"))) {
                laboratoryCount++;
              }
            }
          }
        });
      }

      newStats.newPatientCount = newPatientCount;
      newStats.laboratoryCount = laboratoryCount;
    };

    const calculateReferralData = async (notifications, newStats) => {
      if (userRole === "Admin" || userRole === "Doctor") {
        const referralsData = mockDatabase.referrals;
        let pendingCount = 0;

        if (referralsData) {
          Object.entries(referralsData).forEach(([key, referral]) => {
            if (referral.status === 'pending') {
              pendingCount++;
              const daysSince = Math.floor((Date.now() - referral.dateCreated) / (1000 * 60 * 60 * 24));
              
              notifications.push({
                id: `referral-${key}`,
                type: 'referral',
                priority: daysSince > 3 ? 'high' : 'medium',
                title: 'Pending Referral',
                message: `${referral.patientName} - ${daysSince} days pending`,
                timestamp: referral.dateCreated,
                category: 'Referrals',
                actionUrl: '/referrals'
              });
            }
          });
        }
        newStats.pendingReferrals = pendingCount;
      }
    };

    const calculateScheduleData = async (notifications, newStats) => {
      const schedulesData = mockDatabase.schedules;
      let upcomingCount = 0;

      if (schedulesData) {
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        Object.entries(schedulesData).forEach(([key, schedule]) => {
          const scheduleTime = new Date(schedule.dateTime);
          
          if (scheduleTime > now && scheduleTime <= oneHourFromNow) {
            if (userRole === "Admin" || userRole === schedule.department) {
              upcomingCount++;
              notifications.push({
                id: `schedule-${key}`,
                type: 'schedule',
                priority: 'high',
                title: 'Upcoming Appointment',
                message: `${schedule.patientName} at ${scheduleTime.toLocaleTimeString()}`,
                timestamp: schedule.dateTime,
                category: 'Schedules',
                actionUrl: '/schedules'
              });
            }
          }
        });
      }
      newStats.upcomingAppointments = upcomingCount;
    };

    const calculatePrescriptionData = async (notifications, newStats) => {
      if (userRole === "Admin" || userRole === "Pharmacy" || userRole === "Doctor") {
        const prescriptionsData = mockDatabase.patientPrescription;
        let pendingCount = 0;

        if (prescriptionsData) {
          Object.entries(prescriptionsData).forEach(([key, prescription]) => {
            if (prescription.status === 'pending') {
              pendingCount++;
              const hoursSince = Math.floor((Date.now() - prescription.dateCreated) / (1000 * 60 * 60));
              
              notifications.push({
                id: `prescription-${key}`,
                type: 'prescription',
                priority: hoursSince > 24 ? 'high' : 'medium',
                title: 'Pending Prescription',
                message: `${prescription.patientName} - ${hoursSince}h ago`,
                timestamp: prescription.dateCreated,
                category: 'Prescriptions',
                actionUrl: '/prescriptions'
              });
            }
          });
        }
        newStats.pendingPrescriptions = pendingCount;
      }
    };

    const calculateFeedbackData = async (notifications, newStats) => {
      if (userRole === "Admin") {
        const feedbackData = mockDatabase.feedback;
        let unreadCount = 0;

        if (feedbackData) {
          Object.entries(feedbackData).forEach(([key, feedback]) => {
            if (!feedback.reviewed) {
              unreadCount++;
              notifications.push({
                id: `feedback-${key}`,
                type: 'feedback',
                priority: feedback.rating <= 2 ? 'high' : 'low',
                title: 'New Feedback',
                message: `${feedback.rating}⭐ - ${feedback.message?.substring(0, 50)}...`,
                timestamp: feedback.timestamp,
                category: 'Feedback',
                actionUrl: '/feedback'
              });
            }
          });
        }
        newStats.unreadFeedback = unreadCount;
      }
    };

    const calculateSalesData = async (newStats) => {
      let totalSales = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // From transactions
      const transactionsData = mockDatabase.transactions;
      if (transactionsData) {
        Object.entries(transactionsData).forEach(([key, transaction]) => {
          const transactionDate = new Date(transaction.dateTime);
          transactionDate.setHours(0, 0, 0, 0);
          
          if (transactionDate.getTime() === today.getTime()) {
            totalSales += parseFloat(transaction.amount || 0);
          }
        });
      }

      // From patient bills
      const patientsData = mockDatabase.patients;
      if (patientsData) {
        Object.entries(patientsData).forEach(([key, patient]) => {
          const patientDate = new Date(patient.dateTime);
          patientDate.setHours(0, 0, 0, 0);
          
          if (patientDate.getTime() === today.getTime()) {
            if (patient.services) {
              patient.services.forEach(service => {
                totalSales += parseFloat(service.cost || 0);
              });
            }
            if (patient.totalBill) {
              totalSales += parseFloat(patient.totalBill || 0);
            }
          }
        });
      }

      newStats.salesToday = totalSales;
    };

    fetchDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);

  }, [userRole]);

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
        <h1 className="text-3xl font-bold text-gray-900">Healthcare Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* New Patients Today */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Patients</p>
                <p className="text-2xl font-bold text-blue-600">{stats.newPatientCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          {/* Laboratory Services */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lab Services</p>
                <p className="text-2xl font-bold text-purple-600">{stats.laboratoryCount}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          {/* Sales Today */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sales Today</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.salesToday)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          {/* Low Stock Items */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStockCount}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pending Referrals */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Referrals</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingReferrals}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next Hour</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.upcomingAppointments}</p>
              </div>
              <Clock className="h-8 w-8 text-indigo-500" />
            </div>
          </div>

          {/* Pending Prescriptions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Rx</p>
                <p className="text-2xl font-bold text-teal-600">{stats.pendingPrescriptions}</p>
              </div>
              <FileText className="h-8 w-8 text-teal-500" />
            </div>
          </div>

          {/* Unread Feedback */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Feedback</p>
                <p className="text-2xl font-bold text-pink-600">{stats.unreadFeedback}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-pink-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications & Alerts */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications & Alerts
          </h2>
          <span className="bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded-full">
            {notifications.length} Active
          </span>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">All Clear!</p>
              <p>No notifications at this time.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
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
                      {notification.actionUrl && (
                        <button className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                          <span>View</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 text-left">
            <Users className="h-8 w-8 text-blue-500 mb-3" />
            <h3 className="font-semibold text-gray-900">Add New Patient</h3>
            <p className="text-sm text-gray-600">Register a new patient</p>
          </button>
          
          <button className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 text-left">
            <Clock className="h-8 w-8 text-green-500 mb-3" />
            <h3 className="font-semibold text-gray-900">Schedule Appointment</h3>
            <p className="text-sm text-gray-600">Book a new appointment</p>
          </button>
          
          <button className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 text-left">
            <ShoppingCart className="h-8 w-8 text-purple-500 mb-3" />
            <h3 className="font-semibold text-gray-900">Manage Inventory</h3>
            <p className="text-sm text-gray-600">Check stock levels</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;