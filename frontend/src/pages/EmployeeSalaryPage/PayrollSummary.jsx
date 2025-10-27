import React from 'react';
import { Clock, DollarSign, TrendingUp, Users } from 'lucide-react';

const PayrollSummary = ({ employees, calculateSalary }) => {
  const totalRegularHours = employees.reduce((sum, emp) => sum + calculateSalary(emp.id).regularHours, 0);
  const totalOvertimeHours = employees.reduce((sum, emp) => sum + calculateSalary(emp.id).overtimeHours, 0);
  const totalPayroll = employees.reduce((sum, emp) => sum + calculateSalary(emp.id).totalPay, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-blue-600" />
        </div>
        Payroll Summary
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-700 font-medium">Total Employees</p>
          </div>
          <p className="text-3xl font-bold text-blue-900">{employees.length}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700 font-medium">Regular Hours</p>
          </div>
          <p className="text-3xl font-bold text-green-900">{totalRegularHours.toFixed(1)}h</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <p className="text-sm text-orange-700 font-medium">Overtime Hours</p>
          </div>
          <p className="text-3xl font-bold text-orange-900">{totalOvertimeHours.toFixed(1)}h</p>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <p className="text-sm text-emerald-700 font-medium">Total Payroll</p>
          </div>
          <p className="text-3xl font-bold text-emerald-900">₱{totalPayroll.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default PayrollSummary;