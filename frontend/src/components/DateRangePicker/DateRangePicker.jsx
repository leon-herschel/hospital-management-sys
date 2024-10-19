
import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  return (
    <div className="flex space-x-2">
      {/* Start Date Picker */}
      <DatePicker
        selected={startDate}
        onChange={onStartDateChange}
        selectsStart
        startDate={startDate}
        endDate={endDate}
        placeholderText="Start Date"
        className="border rounded-md px-4 py-2"
      />
      {/* End Date Picker */}
      <DatePicker
        selected={endDate}
        onChange={onEndDateChange}
        selectsEnd
        startDate={startDate}
        endDate={endDate}
        minDate={startDate}
        placeholderText="End Date"
        className="border rounded-md px-4 py-2"
      />
    </div>
  );
};

export default DateRangePicker;
