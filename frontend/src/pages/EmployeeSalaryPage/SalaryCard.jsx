import React from 'react';
import { DollarSign, Clock, Calendar, TrendingUp, Settings, Briefcase } from 'lucide-react';

const SalaryCard = ({ employee, salary, onSetRate, isSearchView = false }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{employee.name}</h3>
            <div className="flex flex-wrap gap-2 text-sm opacity-90">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {employee.role}
              </span>
              <span>•</span>
              <span>{employee.department}</span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetRate(employee.id);
            }}
            className="px-3 py-1.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-colors flex items-center gap-1 text-sm"
          >
            <Settings className="w-4 h-4" />
            Set Rate
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Hourly Rate */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs text-purple-700 font-medium">Hourly Rate</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">₱{employee.hourlyRate}</p>
          </div>

          {/* Total Hours */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs text-blue-700 font-medium">Total Hours</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{salary.totalHours.toFixed(1)}h</p>
          </div>

          {/* Regular Hours */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs text-green-700 font-medium">Regular Hours</span>
            </div>
            <p className="text-xl font-bold text-green-900">{salary.regularHours.toFixed(1)}h</p>
            <p className="text-xs text-green-600 mt-1">₱{salary.regularPay.toLocaleString()}</p>
          </div>

          {/* Overtime Hours */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs text-orange-700 font-medium">Overtime</span>
            </div>
            <p className="text-xl font-bold text-orange-900">{salary.overtimeHours.toFixed(1)}h</p>
            <p className="text-xs text-orange-600 mt-1">₱{salary.overtimePay.toLocaleString()}</p>
          </div>
        </div>

        {/* Total Pay Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90 mb-1">Total Estimated Salary</p>
              <p className="text-3xl font-bold">₱{salary.totalPay.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Email (optional) */}
        {isSearchView && (
          <p className="text-xs text-gray-500 mt-3 truncate">{employee.email}</p>
        )}
      </div>
    </div>
  );
};

export default SalaryCard;