import React, { useState, useEffect } from "react";
import { getDatabase, ref, get, onValue } from "firebase/database";
import {
  Bell,
  Clock,
  User,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";

const AdminSpecialist = () => {
  const [referrals, setReferrals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

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
      }
    });
    return () => unsubscribe();
  }, []);

  // Clear notification
  const clearNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading referrals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Specialist Dashboard
          </h1>
          <p className="text-gray-600">
            Manage and monitor specialist referrals
          </p>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              Status Updates ({notifications.length})
            </h2>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900">
                          Referral {notification.referralId}
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-blue-600 mt-2 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.timestamp}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => clearNotification(notification.id)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Total Referrals
                </p>
                <p className="text-3xl font-bold">{referrals.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold">
                  {
                    referrals.filter(
                      (r) => r.status?.toLowerCase() === "pending"
                    ).length
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold">
                  {
                    referrals.filter(
                      (r) => r.status?.toLowerCase() === "completed"
                    ).length
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Confirmed</p>
                <p className="text-3xl font-bold">
                  {
                    referrals.filter(
                      (r) => r.status?.toLowerCase() === "confirmed"
                    ).length
                  }
                </p>
              </div>
              <User className="h-8 w-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Referrals Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Specialist Referrals
                </h2>
                <p className="text-gray-600 mt-1">
                  Manage and track all patient referrals
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border">
                  <span className="text-sm text-gray-600">
                    Active Referrals:{" "}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {referrals.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {referrals.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-gray-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No Referrals Found
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Connect to Firebase to load referral data or check your database
                connection.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Patient</span>
                      </div>
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Specialist</span>
                      </div>
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Referring Doctor</span>
                      </div>
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Appointment</span>
                      </div>
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>Status</span>
                      </div>
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Reason</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {referrals.map((referral, index) => (
                    <tr
                      key={referral.id}
                      className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                              {referral.patientFirstName?.charAt(0)}
                              {referral.patientLastName?.charAt(0)}
                            </div>
                          </div>
                          <div className="ml-4">
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
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                              Dr
                            </div>
                          </div>
                          <div className="ml-3">
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
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
                              Dr
                            </div>
                          </div>
                          <div className="ml-3">
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
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="text-sm font-semibold text-gray-900 flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                            {referral.appointmentDate}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-2 text-gray-500" />
                            {referral.appointmentTime}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border-2 ${getStatusColor(
                              referral.status
                            )} shadow-sm`}
                          >
                            <div
                              className={`h-2 w-2 rounded-full mr-2 ${
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
                      <td className="px-8 py-6">
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
