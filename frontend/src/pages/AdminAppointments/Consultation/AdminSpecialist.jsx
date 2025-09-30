import React, { useState, useEffect } from "react";
import { getDatabase, ref, get, onValue } from "firebase/database";
import {
  Bell,
  Clock,
  User,
  Calendar,
  FileText,
  AlertCircle,
  X,
} from "lucide-react";

const AdminSpecialist = () => {
  const [referrals, setReferrals] = useState([]);
  const [filteredReferrals, setFilteredReferrals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const database = getDatabase();
      const referralsRef = ref(database, "referrals");
      const snapshot = await get(referralsRef);
      const data = snapshot.val();

      const referralsArray = Object.keys(data || {}).map((key) => ({
        id: key,
        ...data[key],
      }));

      setReferrals(referralsArray);
      setFilteredReferrals(referralsArray);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  // Filter referrals based on status
  const filterReferrals = (status) => {
    setActiveFilter(status);
    if (status === "all") {
      setFilteredReferrals(referrals);
    } else {
      const filtered = referrals.filter(
        (referral) => referral.status?.toLowerCase() === status.toLowerCase()
      );
      setFilteredReferrals(filtered);
    }
  };

  // Function to combine full names
  const getFullName = (firstName, middleName, lastName) => {
    const middle = middleName ? ` ${middleName} ` : " ";
    return `${firstName}${middle}${lastName}`.replace(/\s+/g, " ").trim();
  };

  // Function to get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  useEffect(() => {
    const database = getDatabase();
    const referralsRef = ref(database, "referrals");
    const unsubscribe = onValue(referralsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const referralsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setReferrals(referralsArray);
        // Re-apply current filter
        if (activeFilter === "all") {
          setFilteredReferrals(referralsArray);
        } else {
          const filtered = referralsArray.filter(
            (referral) =>
              referral.status?.toLowerCase() === activeFilter.toLowerCase()
          );
          setFilteredReferrals(filtered);
        }
      }
    });
    return () => unsubscribe();
  }, [activeFilter]);

  // Clear notification
  const clearNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  // Clear filter
  const clearFilter = () => {
    setActiveFilter("all");
    setFilteredReferrals(referrals);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading referrals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchReferrals}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total",
      value: referrals.length,
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      filter: "all",
    },
    {
      label: "Pending",
      value: referrals.filter((r) => r.status?.toLowerCase() === "pending")
        .length,
      icon: Clock,
      color: "from-yellow-500 to-yellow-600",
      filter: "pending",
    },
    {
      label: "Confirmed",
      value: referrals.filter((r) => r.status?.toLowerCase() === "confirmed")
        .length,
      icon: User,
      color: "from-purple-500 to-purple-600",
      filter: "confirmed",
    },
    {
      label: "Completed",
      value: referrals.filter((r) => r.status?.toLowerCase() === "completed")
        .length,
      icon: Calendar,
      color: "from-green-500 to-green-600",
      filter: "completed",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Admin Specialist Dashboard
          </h1>
          <p className="text-gray-600 text-sm">
            Manage and monitor specialist referrals
          </p>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
              <div className="bg-blue-100 p-2 rounded-full mr-2">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              Status Updates ({notifications.length})
            </h2>
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-1 rounded-full">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900">
                          Referral {notification.referralId}
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-blue-600 mt-1 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.timestamp}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => clearNotification(notification.id)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-2 py-1 rounded text-sm"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <button
              key={stat.filter}
              onClick={() => filterReferrals(stat.filter)}
              className={`bg-gradient-to-r ${
                stat.color
              } rounded-lg shadow-md p-4 text-white hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-left ${
                activeFilter === stat.filter
                  ? "ring-4 ring-white ring-opacity-50"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-medium mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="h-6 w-6 text-white/70" />
              </div>
            </button>
          ))}
        </div>

        {/* Active Filter Indicator */}
        {activeFilter !== "all" && (
          <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 p-1 rounded-full">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-blue-800 font-medium text-sm">
                Showing {activeFilter} referrals ({filteredReferrals.length}{" "}
                results)
              </span>
            </div>
            <button
              onClick={clearFilter}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 bg-white px-3 py-1 rounded-md border border-blue-200 hover:border-blue-300 text-sm"
            >
              <X className="h-3 w-3" />
              <span>Clear Filter</span>
            </button>
          </div>
        )}

        {/* Referrals Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Specialist Referrals
                </h2>
                <p className="text-gray-600 text-sm">
                  Manage and track all patient referrals
                </p>
              </div>
              <div className="bg-white px-3 py-2 rounded-lg shadow-sm border">
                <span className="text-sm text-gray-600">Showing: </span>
                <span className="font-semibold text-gray-900">
                  {filteredReferrals.length}
                </span>
              </div>
            </div>
          </div>

          {filteredReferrals.length === 0 ? (
            <div className="p-8 text-center">
              <div className="bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeFilter === "all"
                  ? "No Referrals Found"
                  : `No ${activeFilter} Referrals`}
              </h3>
              <p className="text-gray-600 text-sm max-w-sm mx-auto">
                {activeFilter === "all"
                  ? "Connect to Firebase to load referral data or check your database connection."
                  : `No referrals with ${activeFilter} status found.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>Patient</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>Specialist</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>Referring Doctor</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Appointment</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Status</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>Reason</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredReferrals.map((referral, index) => (
                    <tr
                      key={referral.id}
                      className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                              {referral.patientFirstName?.charAt(0)}
                              {referral.patientLastName?.charAt(0)}
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-bold text-gray-900">
                              {getFullName(
                                referral.patientFirstName,
                                referral.patientMiddleName,
                                referral.patientLastName
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold text-xs">
                              Dr
                            </div>
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-semibold text-gray-900">
                              {getFullName(
                                referral.assignedSpecialistFirstName,
                                referral.assignedSpecialistMiddleName,
                                referral.assignedSpecialistLastName
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Specialist
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold text-xs">
                              Dr
                            </div>
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-semibold text-gray-900">
                              {getFullName(
                                referral.referringGeneralistFirstName,
                                "",
                                referral.referringGeneralistLastName
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {referral.referringClinicName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                          <div className="text-sm font-semibold text-gray-900 flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-blue-600" />
                            {referral.appointmentDate}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1 text-gray-500" />
                            {referral.appointmentTime}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full border ${getStatusColor(
                              referral.status
                            )} shadow-sm`}
                          >
                            <div
                              className={`h-1.5 w-1.5 rounded-full mr-1 ${
                                referral.status?.toLowerCase() === "pending"
                                  ? "bg-yellow-600"
                                  : referral.status?.toLowerCase() ===
                                    "confirmed"
                                  ? "bg-blue-600"
                                  : referral.status?.toLowerCase() ===
                                    "completed"
                                  ? "bg-green-600"
                                  : "bg-gray-600"
                              }`}
                            ></div>
                            {referral.status?.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {referral.initialReasonForReferral}
                          </div>
                          {referral.generalistNotes && (
                            <div className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded border">
                              <span className="font-medium">Notes:</span>{" "}
                              {referral.generalistNotes}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSpecialist;
