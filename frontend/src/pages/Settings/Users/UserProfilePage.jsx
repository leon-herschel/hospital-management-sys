import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/authContext/authContext';
import { ref, get, update, push } from 'firebase/database';
import { database } from '../../../firebase/firebase';
import { 
  UserIcon, 
  CheckIcon, 
  XMarkIcon, 
  ClockIcon,
  PlayIcon,
  StopIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

const UsersProfilePage = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [clinicName, setClinicName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Attendance state
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [todayLogs, setTodayLogs] = useState([]);
  const [isCurrentlyClockedIn, setIsCurrentlyClockedIn] = useState(false);
  const [dailySummary, setDailySummary] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: '',
    position: ''
  });

  // Time in/out form state
  const [timeInOutData, setTimeInOutData] = useState({
    shiftType: 'Day Shift',
    location: '',
    notes: '',
    reason: ''
  });

  useEffect(() => {
    fetchUserData();
    fetchTodayAttendance();
  }, [currentUser]);

  const fetchUserData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const userRef = ref(database, `users/${currentUser.uid}`);
      const userSnapshot = await get(userRef);

      if (userSnapshot.exists()) {
        const user = userSnapshot.val();
        setUserData(user);
        
        // Set form data
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || currentUser.email || '',
          phoneNumber: user.phoneNumber || '',
          department: user.department || '',
          position: user.position || ''
        });

        // Set default location based on user data
        setTimeInOutData(prev => ({
          ...prev,
          location: user.department ? `${clinicName || 'Clinic'} - ${user.department}` : ''
        }));

        // Fetch clinic name if available
        if (user.clinicAffiliation) {
          await fetchClinicName(user.clinicAffiliation);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchClinicName = async (clinicId) => {
    try {
      const clinicRef = ref(database, `clinics/${clinicId}`);
      const snapshot = await get(clinicRef);
      if (snapshot.exists()) {
        const name = snapshot.val().name || clinicId;
        setClinicName(name);
        // Update location in timeInOutData
        setTimeInOutData(prev => ({
          ...prev,
          location: userData?.department ? `${name} - ${userData.department}` : name
        }));
      } else {
        setClinicName(clinicId);
      }
    } catch (error) {
      console.error('Error fetching clinic name:', error);
      setClinicName(clinicId);
    }
  };

  const fetchTodayAttendance = async () => {
    if (!currentUser) return;

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const attendanceRef = ref(database, `attendance/${currentUser.uid}/${today}`);
      const snapshot = await get(attendanceRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const logs = data.logs ? Object.entries(data.logs).map(([key, value]) => ({
          id: key,
          ...value
        })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) : [];
        
        setTodayLogs(logs);
        setDailySummary(data.dailySummary || null);
        
        // Check if currently clocked in (last action was timeIn)
        const lastLog = logs[logs.length - 1];
        setIsCurrentlyClockedIn(lastLog?.action === 'timeIn');
      } else {
        setTodayLogs([]);
        setDailySummary(null);
        setIsCurrentlyClockedIn(false);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleTimeAction = async (action) => {
    if (!currentUser) return;

    try {
      setAttendanceLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const timestamp = new Date().toISOString();

      // Create log entry
      const logEntry = {
        action,
        timestamp,
        ...(action === 'timeIn' && {
          shiftType: timeInOutData.shiftType,
          location: timeInOutData.location,
          ...(timeInOutData.notes && { notes: timeInOutData.notes })
        }),
        ...(action === 'timeOut' && {
          ...(timeInOutData.reason && { reason: timeInOutData.reason }),
          ...(timeInOutData.notes && { notes: timeInOutData.notes })
        })
      };

      // Add log to database
      const logsRef = ref(database, `attendance/${currentUser.uid}/${today}/logs`);
      await push(logsRef, logEntry);

      // Calculate and update daily summary
      await updateDailySummary();

      // Refresh attendance data
      await fetchTodayAttendance();

      // Clear form data
      setTimeInOutData(prev => ({
        shiftType: 'Day Shift',
        location: prev.location,
        notes: '',
        reason: ''
      }));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error recording time action:', error);
      setError(`Failed to ${action === 'timeIn' ? 'clock in' : 'clock out'}. Please try again.`);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const updateDailySummary = async () => {
    if (!currentUser) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const attendanceRef = ref(database, `attendance/${currentUser.uid}/${today}/logs`);
      const snapshot = await get(attendanceRef);

      if (snapshot.exists()) {
        const logs = Object.values(snapshot.val()).sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );

        let totalMinutes = 0;
        let overtimeMinutes = 0;
        const standardWorkDay = 8 * 60; // 8 hours in minutes

        for (let i = 0; i < logs.length; i += 2) {
          const timeIn = logs[i];
          const timeOut = logs[i + 1];

          if (timeIn?.action === 'timeIn' && timeOut?.action === 'timeOut') {
            const start = new Date(timeIn.timestamp);
            const end = new Date(timeOut.timestamp);
            const sessionMinutes = (end - start) / (1000 * 60);
            totalMinutes += sessionMinutes;
          }
        }

        const totalHours = totalMinutes / 60;
        const overtimeHours = Math.max(0, totalHours - 8);

        const dailySummary = {
          totalHours: Math.round(totalHours * 100) / 100,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          status: totalHours > 0 ? 'Present' : 'Absent'
        };

        // Update summary in database
        const summaryRef = ref(database, `attendance/${currentUser.uid}/${today}/dailySummary`);
        await update(summaryRef, dailySummary);
      }
    } catch (error) {
      console.error('Error updating daily summary:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTimeInOutChange = (e) => {
    const { name, value } = e.target;
    setTimeInOutData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);
      setError(null);
      
      const userRef = ref(database, `users/${currentUser.uid}`);
      await update(userRef, formData);

      // Update local state
      setUserData(prev => ({ ...prev, ...formData }));
      setIsEditing(false);
      setSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating user data:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || currentUser.email || '',
        phoneNumber: userData.phoneNumber || '',
        department: userData.department || '',
        position: userData.position || ''
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {formData.firstName} {formData.lastName}
                  </h1>
                  <p className="text-gray-500 capitalize">
                    {userData?.role || 'User'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                    >
                      <CheckIcon className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              {isEditing || saving ? 'Profile updated successfully!' : 'Time recorded successfully!'}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Attendance Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <ClockIcon className="w-5 h-5" />
                  <span>Attendance</span>
                </h2>
                <p className="text-sm text-gray-500">Track your daily work hours</p>
              </div>
              {dailySummary && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Today's Hours</p>
                  <p className="text-xl font-bold text-gray-900">{dailySummary.totalHours}h</p>
                  {dailySummary.overtimeHours > 0 && (
                    <p className="text-sm text-orange-600">+{dailySummary.overtimeHours}h overtime</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Time In/Out Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleTimeAction('timeIn')}
                    disabled={isCurrentlyClockedIn || attendanceLoading}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <PlayIcon className="w-5 h-5" />
                    <span>{attendanceLoading ? 'Processing...' : 'Time In'}</span>
                  </button>
                  <button
                    onClick={() => handleTimeAction('timeOut')}
                    disabled={!isCurrentlyClockedIn || attendanceLoading}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <StopIcon className="w-5 h-5" />
                    <span>{attendanceLoading ? 'Processing...' : 'Time Out'}</span>
                  </button>
                </div>

                {isCurrentlyClockedIn && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm font-medium">
                      ✓ Currently clocked in
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Shift Type (for Time In) */}
                {!isCurrentlyClockedIn && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shift Type
                    </label>
                    <select
                      name="shiftType"
                      value={timeInOutData.shiftType}
                      onChange={handleTimeInOutChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Day Shift">Day Shift</option>
                      <option value="Night Shift">Night Shift</option>
                      <option value="Evening Shift">Evening Shift</option>
                      <option value="Weekend">Weekend</option>
                    </select>
                  </div>
                )}

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={timeInOutData.location}
                    onChange={handleTimeInOutChange}
                    placeholder="Enter work location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Reason (for Time Out) */}
                {isCurrentlyClockedIn && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason (Optional)
                    </label>
                    <select
                      name="reason"
                      value={timeInOutData.reason}
                      onChange={handleTimeInOutChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">End of shift</option>
                      <option value="Lunch Break">Lunch Break</option>
                      <option value="Break">Break</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    name="notes"
                    value={timeInOutData.notes}
                    onChange={handleTimeInOutChange}
                    placeholder="Add a note..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Today's Logs */}
            {todayLogs.length > 0 && (
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <CalendarDaysIcon className="w-4 h-4" />
                  <span>Today's Activity</span>
                </h3>
                <div className="space-y-2">
                  {todayLogs.map((log, index) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border ${
                        log.action === 'timeIn'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              log.action === 'timeIn'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.action === 'timeIn' ? 'Time In' : 'Time Out'}
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {log.location && <div>{log.location}</div>}
                          {log.shiftType && <div>{log.shiftType}</div>}
                          {log.reason && <div>Reason: {log.reason}</div>}
                        </div>
                      </div>
                      {log.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          Note: {log.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
            <p className="text-sm text-gray-500">Update your personal information and contact details.</p>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              {/* Position */}
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              {/* Clinic Affiliation (Read-only) */}
              {clinicName && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinic Affiliation
                  </label>
                  <input
                    type="text"
                    value={clinicName}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              )}

              {/* Role (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={userData?.role?.charAt(0).toUpperCase() + userData?.role?.slice(1) || 'User'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersProfilePage;