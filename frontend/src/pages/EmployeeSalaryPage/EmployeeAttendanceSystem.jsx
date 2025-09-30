import React, { useState, useEffect } from 'react';
import { ref, get, update } from 'firebase/database';
import { database } from '../../firebase/firebase'; // Update this path to match your Firebase config file
import { Clock, Calendar, DollarSign, Users, MapPin, Sun, Moon, Filter, Download, Database, Loader, Save, Edit3, X, Search, ChevronLeft, ChevronRight, Settings } from 'lucide-react';

const EmployeeAttendanceSystem = () => {
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [viewMode, setViewMode] = useState('attendance');
  const [editingRates, setEditingRates] = useState({});
  const [savingRates, setSavingRates] = useState({});
  
  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [showSetRateModal, setShowSetRateModal] = useState(false);
  const [selectedEmployeeForRate, setSelectedEmployeeForRate] = useState('');
  const [newHourlyRate, setNewHourlyRate] = useState('');

  // Fetch data from Firebase using your existing pattern
  useEffect(() => {
    const fetchDataFromFirebase = async () => {
      try {
        setLoading(true);
        
        // Fetch users (employees)
        const usersRef = ref(database, 'users');
        const usersSnapshot = await get(usersRef);
        const usersData = usersSnapshot.exists() ? usersSnapshot.val() : {};
        
        const employeesList = Object.entries(usersData).map(([id, user]) => ({
          id,
          name: user.name || user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
          email: user.email,
          role: user.role,
          department: user.department,
          hourlyRate: user.hourlyRate || 0,
          isActive: user.isActive !== false,
          phoneNumber: user.phoneNumber,
          address: user.address,
          employeeId: user.employeeId,
          position: user.position
        })).filter(emp => emp.isActive);

        // Fetch attendance data
        const attendanceRef = ref(database, 'attendance');
        const attendanceSnapshot = await get(attendanceRef);
        const attendanceRecords = attendanceSnapshot.exists() ? attendanceSnapshot.val() : {};

        // Fetch departments
        const departmentsRef = ref(database, 'departments');
        const departmentsSnapshot = await get(departmentsRef);
        const departmentsData = departmentsSnapshot.exists() ? departmentsSnapshot.val() : {};
        
        const departmentsList = Object.entries(departmentsData).map(([id, dept]) => ({
          id,
          name: dept.name || dept.departmentName || dept,
          description: dept.description,
          head: dept.head,
          ...dept
        }));

        // Fetch roles
        const rolesRef = ref(database, 'roles');
        const rolesSnapshot = await get(rolesRef);
        const rolesData = rolesSnapshot.exists() ? rolesSnapshot.val() : {};
        
        const rolesList = Object.entries(rolesData).map(([id, role]) => ({
          id,
          name: role.name || role.roleName || role,
          permissions: role.permissions,
          description: role.description,
          ...role
        }));

        setEmployees(employeesList);
        setAttendanceData(attendanceRecords);
        setDepartments(departmentsList);
        setRoles(rolesList);
        
      } catch (error) {
        console.error('Error fetching data from Firebase:', error);
        setEmployees([]);
        setAttendanceData({});
        setDepartments([]);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDataFromFirebase();
  }, []);

  // Function to update hourly rate using your Firebase pattern
  const updateHourlyRateInFirebase = async (userId, newRate) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, { 
        hourlyRate: parseFloat(newRate) 
      });
      
      // Update local state after successful Firebase update
      setEmployees(prev => prev.map(emp => 
        emp.id === userId ? { ...emp, hourlyRate: parseFloat(newRate) } : emp
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating hourly rate in Firebase:', error);
      throw error;
    }
  };

  // Process attendance logs from the new Firebase structure
  const processAttendanceLogs = (employeeId) => {
    const employeeAttendance = attendanceData[employeeId];
    if (!employeeAttendance) return [];
    
    const allLogs = [];
    
    Object.entries(employeeAttendance).forEach(([date, dayData]) => {
      if (dayData.logs) {
        Object.entries(dayData.logs).forEach(([logId, log]) => {
          allLogs.push({
            id: logId,
            date: new Date(log.timestamp).toLocaleDateString('en-PH'),
            time: new Date(log.timestamp).toLocaleTimeString('en-PH'),
            dailySummary: dayData.dailySummary,
            ...log
          });
        });
      }
    });

    return allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // Calculate monthly summary from daily summaries
  const calculateMonthlySummary = (employeeId, month) => {
    const employeeAttendance = attendanceData[employeeId];
    if (!employeeAttendance) return {
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      daysWorked: 0,
      presentDays: 0
    };

    let totalHours = 0;
    let overtimeHours = 0;
    let daysWorked = 0;
    let presentDays = 0;

    // Filter dates by selected month if provided
    const monthPrefix = month ? month : selectedMonth;
    
    Object.entries(employeeAttendance).forEach(([date, dayData]) => {
      if (date.startsWith(monthPrefix) && dayData.dailySummary) {
        const summary = dayData.dailySummary;
        totalHours += summary.totalHours || 0;
        overtimeHours += summary.overtimeHours || 0;
        daysWorked++;
        
        if (summary.status === 'Present') {
          presentDays++;
        }
      }
    });

    const regularHours = totalHours - overtimeHours;

    return {
      totalHours,
      regularHours,
      overtimeHours,
      daysWorked,
      presentDays
    };
  };

  const calculateSalary = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    const hourlyRate = employee?.hourlyRate || 0;
    const monthlySummary = calculateMonthlySummary(employeeId);
    
    const regularPay = monthlySummary.regularHours * hourlyRate;
    const overtimePay = monthlySummary.overtimeHours * hourlyRate * 1.5; // 1.5x for overtime
    
    return {
      ...monthlySummary,
      hourlyRate,
      regularPay,
      overtimePay,
      totalPay: regularPay + overtimePay
    };
  };

  const handleEditRate = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    setEditingRates(prev => ({
      ...prev,
      [employeeId]: employee.hourlyRate
    }));
  };

  const handleSaveRate = async (employeeId) => {
    const newRate = editingRates[employeeId];
    if (newRate === undefined) return;

    setSavingRates(prev => ({ ...prev, [employeeId]: true }));
    
    try {
      await updateHourlyRateInFirebase(employeeId, parseFloat(newRate));
      setEditingRates(prev => {
        const updated = { ...prev };
        delete updated[employeeId];
        return updated;
      });
    } catch (error) {
      console.error('Failed to update hourly rate:', error);
      // You might want to show an error message to the user here
    } finally {
      setSavingRates(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const handleCancelEdit = (employeeId) => {
    setEditingRates(prev => {
      const updated = { ...prev };
      delete updated[employeeId];
      return updated;
    });
  };

  // Handle individual rate setting from modal
  const handleSetHourlyRate = async () => {
    if (!selectedEmployeeForRate || !newHourlyRate) return;

    setSavingRates(prev => ({ ...prev, [selectedEmployeeForRate]: true }));
    
    try {
      await updateHourlyRateInFirebase(selectedEmployeeForRate, parseFloat(newHourlyRate));
      setShowSetRateModal(false);
      setSelectedEmployeeForRate('');
      setNewHourlyRate('');
    } catch (error) {
      console.error('Failed to set hourly rate:', error);
    } finally {
      setSavingRates(prev => ({ ...prev, [selectedEmployeeForRate]: false }));
    }
  };

  // Open modal for specific employee
  const openSetRateModal = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    setSelectedEmployeeForRate(employeeId);
    setNewHourlyRate(employee.hourlyRate.toString());
    setShowSetRateModal(true);
  };

  // Search and pagination logic
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const Pagination = ({ currentPage, totalPages, onPageChange }) => (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-gray-600">
        Showing {startIndex + 1} to {Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length} employees
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {[...Array(totalPages)].map((_, index) => {
          const page = index + 1;
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 2 && page <= currentPage + 2)
          ) {
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-1 border rounded-md ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          } else if (
            page === currentPage - 3 ||
            page === currentPage + 3
          ) {
            return <span key={page} className="px-2">...</span>;
          }
          return null;
        })}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading data from Firebase database...</p>
          <p className="text-sm text-gray-500 mt-2">Connecting to nodes: attendance, users, departments, roles</p>
        </div>
      </div>
    );
  }

  const AttendanceView = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-green-600" />
          <p className="text-green-800">
            Connected to Firebase Database - Active Nodes: attendance, users, departments, roles
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Employees ({employees.length})</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
          ))}
        </select>
        
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        
        <button className="flex items-center justify-center gap-2 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700">
          <Download className="w-4 h-4" />
          Export Attendance
        </button>
      </div>

      {!selectedEmployee && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employees by name, email, role, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {selectedEmployee ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {employees.find(emp => emp.id === selectedEmployee)?.name}
              </h3>
              <p className="text-gray-600">
                {employees.find(emp => emp.id === selectedEmployee)?.role} - 
                {employees.find(emp => emp.id === selectedEmployee)?.department}
              </p>
              <p className="text-sm text-gray-500">
                {employees.find(emp => emp.id === selectedEmployee)?.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm opacity-90">Total Hours</span>
              </div>
              <p className="text-2xl font-bold">
                {calculateMonthlySummary(selectedEmployee).totalHours.toFixed(1)}h
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm opacity-90">Days Worked</span>
              </div>
              <p className="text-2xl font-bold">
                {calculateMonthlySummary(selectedEmployee).daysWorked}
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm opacity-90">Overtime Hours</span>
              </div>
              <p className="text-2xl font-bold">
                {calculateMonthlySummary(selectedEmployee).overtimeHours.toFixed(1)}h
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-400 to-purple-600 text-white p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm opacity-90">Hourly Rate</span>
              </div>
              <p className="text-2xl font-bold">
                ₱{employees.find(emp => emp.id === selectedEmployee)?.hourlyRate || 0}
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-white p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm opacity-90">Est. Salary</span>
              </div>
              <p className="text-2xl font-bold">
                ₱{calculateSalary(selectedEmployee).totalPay.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Attendance Logs</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left">Date</th>
                    <th className="border border-gray-300 p-3 text-left">Time</th>
                    <th className="border border-gray-300 p-3 text-left">Action</th>
                    <th className="border border-gray-300 p-3 text-left">Location</th>
                    <th className="border border-gray-300 p-3 text-left">Shift Type</th>
                    <th className="border border-gray-300 p-3 text-left">Daily Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {processAttendanceLogs(selectedEmployee).map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3">{log.date}</td>
                      <td className="border border-gray-300 p-3">{log.time}</td>
                      <td className="border border-gray-300 p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          log.action === 'timeIn' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.action === 'timeIn' ? '🟢 Time In' : '🔴 Time Out'}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-3">
                        {log.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {log.location}
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 p-3">
                        {log.shiftType && (
                          <div className="flex items-center gap-1">
                            {log.shiftType === 'Day Shift' ? 
                              <Sun className="w-4 h-4 text-yellow-500" /> : 
                              <Moon className="w-4 h-4 text-blue-500" />
                            }
                            {log.shiftType}
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 p-3">
                        {log.dailySummary && (
                          <div className="text-sm">
                            <div className="font-medium">
                              {log.dailySummary.totalHours?.toFixed(1)}h
                            </div>
                            {log.dailySummary.overtimeHours > 0 && (
                              <div className="text-orange-600">
                                +{log.dailySummary.overtimeHours?.toFixed(1)}h OT
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentEmployees.map(employee => {
              const monthlySummary = calculateMonthlySummary(employee.id);
              const salary = calculateSalary(employee.id);
              return (
                <div key={employee.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                     onClick={() => setSelectedEmployee(employee.id)}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-600">{employee.role}</p>
                      <p className="text-xs text-gray-500">{employee.department}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openSetRateModal(employee.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                      title="Set Hourly Rate"
                    >
                      <Settings className="w-4 h-4" />
                      Set Rate
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Hours:</span>
                      <span className="font-medium">{monthlySummary.totalHours.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Days Worked:</span>
                      <span className="font-medium">{monthlySummary.daysWorked}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Overtime:</span>
                      <span className="font-medium text-orange-600">{monthlySummary.overtimeHours.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Hourly Rate:</span>
                      <span className="font-medium">₱{employee.hourlyRate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Est. Salary:</span>
                      <span className="font-medium text-green-600">
                        ₱{salary.totalPay.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredEmployees.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );

  const SalaryView = () => {
    // Apply search and pagination to salary view as well
    const salaryCurrentEmployees = currentEmployees;

    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employees by name, email, role, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Salary Calculation - {selectedMonth}</h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <Download className="w-4 h-4" />
                Export Payroll
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left">Employee</th>
                  <th className="border border-gray-300 p-3 text-left">Role</th>
                  <th className="border border-gray-300 p-3 text-left">Department</th>
                  <th className="border border-gray-300 p-3 text-left">Hourly Rate (₱)</th>
                  <th className="border border-gray-300 p-3 text-left">Total Hours</th>
                  <th className="border border-gray-300 p-3 text-left">Regular Hours</th>
                  <th className="border border-gray-300 p-3 text-left">OT Hours</th>
                  <th className="border border-gray-300 p-3 text-left">Regular Pay</th>
                  <th className="border border-gray-300 p-3 text-left">OT Pay</th>
                  <th className="border border-gray-300 p-3 text-left">Total Pay</th>
                  <th className="border border-gray-300 p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaryCurrentEmployees.map(employee => {
                  const salary = calculateSalary(employee.id);
                  const isEditing = editingRates.hasOwnProperty(employee.id);
                  const isSaving = savingRates[employee.id];
                  
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3">
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-xs text-gray-500">{employee.email}</div>
                        </div>
                      </td>
                      <td className="border border-gray-300 p-3">{employee.role}</td>
                      <td className="border border-gray-300 p-3">{employee.department}</td>
                      <td className="border border-gray-300 p-3">
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={editingRates[employee.id]}
                                onChange={(e) => setEditingRates(prev => ({
                                  ...prev,
                                  [employee.id]: e.target.value
                                }))}
                                className="w-20 p-1 border border-gray-300 rounded text-center"
                                min="0"
                                step="50"
                                disabled={isSaving}
                              />
                              <button
                                onClick={() => handleSaveRate(employee.id)}
                                disabled={isSaving}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50"
                              >
                                {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleCancelEdit(employee.id)}
                                disabled={isSaving}
                                className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>₱{employee.hourlyRate}</span>
                              <button
                                onClick={() => handleEditRate(employee.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 p-3 font-medium">{salary.totalHours.toFixed(1)}h</td>
                      <td className="border border-gray-300 p-3">{salary.regularHours.toFixed(1)}h</td>
                      <td className="border border-gray-300 p-3 text-orange-600">{salary.overtimeHours.toFixed(1)}h</td>
                      <td className="border border-gray-300 p-3">₱{salary.regularPay.toLocaleString()}</td>
                      <td className="border border-gray-300 p-3 text-orange-600">₱{salary.overtimePay.toLocaleString()}</td>
                      <td className="border border-gray-300 p-3 font-bold text-green-600">
                        ₱{salary.totalPay.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-3">
                        <button
                          onClick={() => openSetRateModal(employee.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                          title="Set Hourly Rate"
                        >
                          <Settings className="w-4 h-4" />
                          Set Rate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredEmployees.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
          
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-xl font-bold text-blue-600">{employees.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Regular Hours</p>
                <p className="text-xl font-bold text-blue-600">
                  {employees.reduce((sum, emp) => sum + calculateSalary(emp.id).regularHours, 0).toFixed(1)}h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Overtime Hours</p>
                <p className="text-xl font-bold text-orange-600">
                  {employees.reduce((sum, emp) => sum + calculateSalary(emp.id).overtimeHours, 0).toFixed(1)}h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Payroll</p>
                <p className="text-2xl font-bold text-green-600">
                  ₱{employees.reduce((sum, emp) => sum + calculateSalary(emp.id).totalPay, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-600 p-3 rounded-full">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Attendance & Salary System</h1>
            <p className="text-gray-600">Connected to Firebase Database - Real-time attendance tracking and payroll calculation</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setViewMode('attendance')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              viewMode === 'attendance'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Attendance Tracking
            </div>
          </button>
          
          <button
            onClick={() => setViewMode('salary')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              viewMode === 'salary'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Salary Calculation
            </div>
          </button>
        </div>

        {viewMode === 'attendance' ? <AttendanceView /> : <SalaryView />}

        {/* Set Hourly Rate Modal */}
        {showSetRateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Set Hourly Rate</h3>
                <button
                  onClick={() => setShowSetRateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                    {employees.find(emp => emp.id === selectedEmployeeForRate)?.name || 'No employee selected'}
                    {selectedEmployeeForRate && (
                      <div className="text-sm text-gray-600 mt-1">
                        {employees.find(emp => emp.id === selectedEmployeeForRate)?.role} - 
                        {employees.find(emp => emp.id === selectedEmployeeForRate)?.department}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Hourly Rate (₱)
                  </label>
                  <input
                    type="number"
                    value={newHourlyRate}
                    onChange={(e) => setNewHourlyRate(e.target.value)}
                    placeholder="Enter hourly rate..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="50"
                  />
                  {selectedEmployeeForRate && (
                    <p className="text-sm text-gray-500 mt-1">
                      Current rate: ₱{employees.find(emp => emp.id === selectedEmployeeForRate)?.hourlyRate || 0}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSetRateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetHourlyRate}
                  disabled={!selectedEmployeeForRate || !newHourlyRate || savingRates[selectedEmployeeForRate]}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingRates[selectedEmployeeForRate] ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Update Rate'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAttendanceSystem;