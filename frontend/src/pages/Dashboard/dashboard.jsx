import { useState, useEffect } from "react";
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/firebase'; // Adjust path as needed
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

  useEffect(() => {
    // Set user role - you can get this from your authentication context
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

    // Enhanced calculateInventoryData function with inventoryTransactions and clinicInventory support

const calculateInventoryData = async (notifications, newStats) => {
  if (userRole === "Admin" || userRole === "CSR" || userRole === "Pharmacy") {
    return new Promise((resolve) => {
      let lowStockCount = 0;
      const inventoryPromises = [];

      // Get main inventory items
      const inventoryItemsPromise = new Promise((inventoryResolve) => {
        const inventoryRef = ref(database, 'inventoryItems');
        onValue(inventoryRef, (snapshot) => {
          const inventoryData = snapshot.val() || {};
          inventoryResolve(inventoryData);
        });
      });

      // Get clinic inventory
      const clinicInventoryPromise = new Promise((clinicResolve) => {
        const clinicInventoryRef = ref(database, 'clinicInventory');
        onValue(clinicInventoryRef, (snapshot) => {
          const clinicInventoryData = snapshot.val() || {};
          clinicResolve(clinicInventoryData);
        });
      });

      // Get recent inventory transactions for context
      const transactionsPromise = new Promise((transactionResolve) => {
        const transactionsRef = ref(database, 'inventoryTransactions');
        onValue(transactionsRef, (snapshot) => {
          const transactionsData = snapshot.val() || {};
          transactionResolve(transactionsData);
        });
      });

      Promise.all([inventoryItemsPromise, clinicInventoryPromise, transactionsPromise])
        .then(([inventoryItems, clinicInventory, transactions]) => {
          
          // Process main inventory items
          Object.entries(inventoryItems).forEach(([key, item]) => {
            const quantity = item.quantity || 0;
            const minQuantity = item.minQuantity || item.reorderLevel || 10;
            
            if (quantity <= minQuantity) {
              lowStockCount++;
              
              // Check recent transactions for this item to provide context
              const recentTransactions = getRecentTransactionsForItem(transactions, item.itemName || item.name, 7); // Last 7 days
              const lastRestock = getLastRestockDate(recentTransactions);
              
              let contextMessage = `${item.itemName || item.name}: ${quantity} remaining (min: ${minQuantity})`;
              if (lastRestock) {
                const daysSinceRestock = Math.floor((Date.now() - new Date(lastRestock)) / (1000 * 60 * 60 * 24));
                contextMessage += ` - Last restocked ${daysSinceRestock} days ago`;
              }
              
              notifications.push({
                id: `inventory-${key}`,
                type: 'inventory',
                priority: quantity === 0 ? 'high' : 'medium',
                title: quantity === 0 ? 'Out of Stock' : 'Low Stock Alert',
                message: contextMessage,
                timestamp: new Date().toISOString(),
                category: 'Inventory',
                actionUrl: '/inventory',
                metadata: {
                  itemId: key,
                  currentStock: quantity,
                  minStock: minQuantity,
                  lastRestock: lastRestock,
                  location: 'main'
                }
              });
            }
          });

          // Process clinic inventory items
          Object.entries(clinicInventory).forEach(([key, item]) => {
            const quantity = item.quantity || 0;
            const minQuantity = item.minQuantity || item.reorderLevel || 5; // Typically lower threshold for clinic items
            
            if (quantity <= minQuantity) {
              lowStockCount++;
              
              notifications.push({
                id: `clinic-inventory-${key}`,
                type: 'inventory',
                priority: quantity === 0 ? 'high' : 'medium',
                title: quantity === 0 ? 'Clinic Out of Stock' : 'Clinic Low Stock',
                message: `Clinic: ${item.itemName || item.name}: ${quantity} remaining (min: ${minQuantity})`,
                timestamp: new Date().toISOString(),
                category: 'Clinic Inventory',
                actionUrl: '/clinic-inventory',
                metadata: {
                  itemId: key,
                  currentStock: quantity,
                  minStock: minQuantity,
                  location: 'clinic'
                }
              });
            }
          });

          // Check for items with suspicious transaction patterns
          checkForSuspiciousTransactionPatterns(transactions, notifications);

          // Check for items that haven't been restocked in a long time
          checkForOverdueRestocking(inventoryItems, transactions, notifications);

          newStats.lowStockCount = lowStockCount;
          resolve();
        })
        .catch((error) => {
          console.error('Error calculating inventory data:', error);
          newStats.lowStockCount = 0;
          resolve();
        });
    });
  }
};

// Helper function to get recent transactions for a specific item
const getRecentTransactionsForItem = (transactions, itemName, days = 7) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return Object.entries(transactions)
    .filter(([key, transaction]) => {
      const transactionDate = new Date(transaction.dateTime || transaction.date);
      const matchesItem = (transaction.itemName || transaction.item) === itemName;
      return matchesItem && transactionDate >= cutoffDate;
    })
    .map(([key, transaction]) => ({ id: key, ...transaction }))
    .sort((a, b) => new Date(b.dateTime || b.date) - new Date(a.dateTime || a.date));
};

// Helper function to get the last restock date for an item
const getLastRestockDate = (transactions) => {
  const restockTransaction = transactions.find(t => 
    t.type === 'stock_in' || 
    t.type === 'restock' || 
    t.type === 'purchase' ||
    (t.quantity && parseInt(t.quantity) > 0 && t.transactionType === 'in')
  );
  return restockTransaction ? (restockTransaction.dateTime || restockTransaction.date) : null;
};

// Helper function to check for suspicious transaction patterns
const checkForSuspiciousTransactionPatterns = (transactions, notifications) => {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Group transactions by item in the last 24 hours
  const recentTransactionsByItem = {};
  
  Object.entries(transactions).forEach(([key, transaction]) => {
    const transactionDate = new Date(transaction.dateTime || transaction.date);
    if (transactionDate >= last24Hours) {
      const itemName = transaction.itemName || transaction.item || 'Unknown Item';
      if (!recentTransactionsByItem[itemName]) {
        recentTransactionsByItem[itemName] = [];
      }
      recentTransactionsByItem[itemName].push({ id: key, ...transaction });
    }
  });

  // Check for items with high outgoing transactions (possible high demand or issues)
  Object.entries(recentTransactionsByItem).forEach(([itemName, itemTransactions]) => {
    const outgoingTransactions = itemTransactions.filter(t => 
      t.type === 'stock_out' || 
      t.type === 'sale' || 
      t.type === 'dispensed' ||
      (t.quantity && parseInt(t.quantity) < 0) ||
      t.transactionType === 'out'
    );

    if (outgoingTransactions.length >= 5) { // 5 or more outgoing transactions in 24 hours
      const totalOutgoing = outgoingTransactions.reduce((sum, t) => 
        sum + Math.abs(parseInt(t.quantity) || 1), 0
      );

      notifications.push({
        id: `high-demand-${itemName.replace(/\s+/g, '-')}`,
        type: 'inventory',
        priority: 'medium',
        title: 'High Demand Alert',
        message: `${itemName}: ${outgoingTransactions.length} transactions (${totalOutgoing} units) in last 24h`,
        timestamp: new Date().toISOString(),
        category: 'Inventory Trends',
        actionUrl: '/inventory-analytics',
        metadata: {
          itemName: itemName,
          transactionCount: outgoingTransactions.length,
          totalQuantity: totalOutgoing,
          timeframe: '24h'
        }
      });
    }
  });
};

// Helper function to check for items that haven't been restocked in a long time
const checkForOverdueRestocking = (inventoryItems, transactions, notifications) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  Object.entries(inventoryItems).forEach(([key, item]) => {
    const itemName = item.itemName || item.name;
    const quantity = item.quantity || 0;
    const maxQuantity = item.maxQuantity || 100;
    
    // Only check items that are not currently well-stocked
    if (quantity < maxQuantity * 0.8) { // Less than 80% of max capacity
      const recentTransactions = getRecentTransactionsForItem(transactions, itemName, 30);
      const lastRestock = getLastRestockDate(recentTransactions);
      
      if (!lastRestock || new Date(lastRestock) < thirtyDaysAgo) {
        const daysSinceRestock = lastRestock ? 
          Math.floor((now - new Date(lastRestock)) / (1000 * 60 * 60 * 24)) : 
          'Never';

        notifications.push({
          id: `overdue-restock-${key}`,
          type: 'inventory',
          priority: 'medium',
          title: 'Overdue Restock',
          message: `${itemName}: No restock in ${daysSinceRestock === 'Never' ? 'over 30 days' : daysSinceRestock + ' days'}`,
          timestamp: new Date().toISOString(),
          category: 'Inventory Management',
          actionUrl: '/inventory',
          metadata: {
            itemId: key,
            itemName: itemName,
            currentStock: quantity,
            maxStock: maxQuantity,
            lastRestock: lastRestock,
            daysSinceRestock: daysSinceRestock
          }
        });
      }
    }
  });
};

    const calculatePatientData = async (newStats) => {
      return new Promise((resolve) => {
        const patientsRef = ref(database, 'patients');
        onValue(patientsRef, (snapshot) => {
          let newPatientCount = 0;
          let laboratoryCount = 0;
          const patientsData = snapshot.val();

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
          resolve();
        });
      });
    };

    const calculateReferralData = async (notifications, newStats) => {
      if (userRole === "Admin" || userRole === "Doctor") {
        return new Promise((resolve) => {
          const referralsRef = ref(database, 'referrals');
          onValue(referralsRef, (snapshot) => {
            let pendingCount = 0;
            const referralsData = snapshot.val();

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
            resolve();
          });
        });
      }
    };

    const calculateScheduleData = async (notifications, newStats) => {
      return new Promise((resolve) => {
        const schedulesRef = ref(database, 'schedules');
        onValue(schedulesRef, (snapshot) => {
          let upcomingCount = 0;
          const schedulesData = snapshot.val();

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
          resolve();
        });
      });
    };

    const calculatePrescriptionData = async (notifications, newStats) => {
      if (userRole === "Admin" || userRole === "Pharmacy" || userRole === "Doctor") {
        return new Promise((resolve) => {
          const prescriptionsRef = ref(database, 'patientPrescription');
          onValue(prescriptionsRef, (snapshot) => {
            let pendingCount = 0;
            const prescriptionsData = snapshot.val();

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
            resolve();
          });
        });
      }
    };

    const calculateFeedbackData = async (notifications, newStats) => {
      if (userRole === "Admin") {
        return new Promise((resolve) => {
          const feedbackRef = ref(database, 'feedback');
          onValue(feedbackRef, (snapshot) => {
            let unreadCount = 0;
            const feedbackData = snapshot.val();

            if (feedbackData) {
              Object.entries(feedbackData).forEach(([key, feedback]) => {
                // Check if status is not "reviewed" (unreviewed feedback)
                if (feedback.status !== "reviewed") {
                  unreadCount++;
                  notifications.push({
                    id: `feedback-${key}`,
                    type: 'feedback',
                    priority: feedback.rating <= 2 ? 'high' : 'low',
                    title: 'New Feedback',
                    message: `${feedback.rating}⭐ - ${feedback.patientName} - ${feedback.comment?.substring(0, 50)}...`,
                    timestamp: feedback.createdAt || feedback.updatedAt,
                    category: 'Feedback',
                    actionUrl: '/feedback'
                  });
                }
              });
            }
            newStats.unreadFeedback = unreadCount;
            resolve();
          });
        });
      }
    };

    const calculateSalesData = async (newStats) => {
      let totalSales = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create promises for all sales data sources
      const clinicBillingPromise = new Promise((resolve) => {
        const clinicBillingRef = ref(database, 'clinicBilling');
        onValue(clinicBillingRef, (snapshot) => {
          let clinicSales = 0;
          const billingData = snapshot.val();
          
          if (billingData) {
            Object.entries(billingData).forEach(([key, billing]) => {
              if (billing.status === 'paid' && billing.dateTime) {
                const billingDate = new Date(billing.dateTime);
                billingDate.setHours(0, 0, 0, 0);
                
                if (billingDate.getTime() === today.getTime()) {
                  clinicSales += parseFloat(billing.totalAmount || billing.amount || 0);
                }
              }
            });
          }
          resolve(clinicSales);
        });
      });

      const inventoryTransactionsPromise = new Promise((resolve) => {
        const inventoryTransactionsRef = ref(database, 'inventoryTransactions');
        onValue(inventoryTransactionsRef, (snapshot) => {
          let inventorySales = 0;
          const transactionsData = snapshot.val();
          
          if (transactionsData) {
            Object.entries(transactionsData).forEach(([key, transaction]) => {
              if (transaction.dateTime) {
                const transactionDate = new Date(transaction.dateTime);
                transactionDate.setHours(0, 0, 0, 0);
                
                if (transactionDate.getTime() === today.getTime()) {
                  inventorySales += parseFloat(transaction.totalAmount || transaction.amount || 0);
                }
              }
            });
          }
          resolve(inventorySales);
        });
      });

      const medicalServicesTransactionsPromise = new Promise((resolve) => {
        const medicalServicesRef = ref(database, 'medicalServicesTransactions');
        onValue(medicalServicesRef, (snapshot) => {
          let servicesSales = 0;
          const servicesData = snapshot.val();
          
          if (servicesData) {
            Object.entries(servicesData).forEach(([key, service]) => {
              if (service.dateTime) {
                const serviceDate = new Date(service.dateTime);
                serviceDate.setHours(0, 0, 0, 0);
                
                if (serviceDate.getTime() === today.getTime()) {
                  servicesSales += parseFloat(service.totalAmount || service.amount || 0);
                }
              }
            });
          }
          resolve(servicesSales);
        });
      });

      // Wait for all promises to resolve and sum up the sales
      try {
        const [clinicSales, inventorySales, servicesSales] = await Promise.all([
          clinicBillingPromise,
          inventoryTransactionsPromise,
          medicalServicesTransactionsPromise
        ]);

        totalSales = clinicSales + inventorySales + servicesSales;
        newStats.salesToday = totalSales;
      } catch (error) {
        console.error('Error calculating sales data:', error);
        newStats.salesToday = 0;
      }
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