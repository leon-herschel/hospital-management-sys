import { useState, useEffect } from "react";
import { ref, update, onValue } from "firebase/database";
import { database } from "../../../firebase/firebase";

const AvailabilityModal = ({ doctor, onClose }) => {
  const [availabilityData, setAvailabilityData] = useState({
    monday: { enabled: false, timeSlots: [] },
    tuesday: { enabled: false, timeSlots: [] },
    wednesday: { enabled: false, timeSlots: [] },
    thursday: { enabled: false, timeSlots: [] },
    friday: { enabled: false, timeSlots: [] },
    saturday: { enabled: false, timeSlots: [] },
    sunday: { enabled: false, timeSlots: [] },
  });

  const [specificDates, setSpecificDates] = useState([]);
  const [newSpecificDate, setNewSpecificDate] = useState({
    date: "",
    timeSlots: []
  });

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    // Load existing availability data
    const availabilityRef = ref(database, `doctors/${doctor.id}/availability`);
    const unsubscribe = onValue(availabilityRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.weeklySchedule) {
          setAvailabilityData(data.weeklySchedule);
        }
        if (data.specificDates) {
          const specificDatesArray = Object.entries(data.specificDates).map(([date, data]) => ({
            date,
            ...data
          }));
          setSpecificDates(specificDatesArray);
        }
      }
    });

    return () => unsubscribe();
  }, [doctor.id]);

  const addTimeSlot = (day) => {
    setAvailabilityData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [...prev[day].timeSlots, { startTime: "09:00", endTime: "17:00" }]
      }
    }));
  };

  const removeTimeSlot = (day, index) => {
    setAvailabilityData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter((_, i) => i !== index)
      }
    }));
  };

  const updateTimeSlot = (day, index, field, value) => {
    setAvailabilityData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map((slot, i) => 
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }));
  };

  const toggleDayEnabled = (day) => {
    setAvailabilityData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        timeSlots: !prev[day].enabled ? [{ startTime: "09:00", endTime: "17:00" }] : []
      }
    }));
  };

  const addSpecificDate = () => {
    if (newSpecificDate.date) {
      setSpecificDates(prev => [...prev, {
        ...newSpecificDate,
        timeSlots: [{ startTime: "09:00", endTime: "17:00" }]
      }]);
      setNewSpecificDate({ date: "", timeSlots: [] });
    }
  };

  const removeSpecificDate = (index) => {
    setSpecificDates(prev => prev.filter((_, i) => i !== index));
  };

  const updateSpecificDateTimeSlot = (dateIndex, slotIndex, field, value) => {
    setSpecificDates(prev => prev.map((dateItem, i) => 
      i === dateIndex ? {
        ...dateItem,
        timeSlots: dateItem.timeSlots.map((slot, j) => 
          j === slotIndex ? { ...slot, [field]: value } : slot
        )
      } : dateItem
    ));
  };

  const addSpecificDateTimeSlot = (dateIndex) => {
    setSpecificDates(prev => prev.map((dateItem, i) => 
      i === dateIndex ? {
        ...dateItem,
        timeSlots: [...dateItem.timeSlots, { startTime: "09:00", endTime: "17:00" }]
      } : dateItem
    ));
  };

  const removeSpecificDateTimeSlot = (dateIndex, slotIndex) => {
    setSpecificDates(prev => prev.map((dateItem, i) => 
      i === dateIndex ? {
        ...dateItem,
        timeSlots: dateItem.timeSlots.filter((_, j) => j !== slotIndex)
      } : dateItem
    ));
  };

  const handleSave = async () => {
    try {
      const availabilityRef = ref(database, `doctors/${doctor.id}/availability`);
      
      // Convert specific dates array to object format for Firebase
      const specificDatesObject = {};
      specificDates.forEach(dateItem => {
        specificDatesObject[dateItem.date] = {
          timeSlots: dateItem.timeSlots
        };
      });

      const dataToSave = {
        weeklySchedule: availabilityData,
        specificDates: specificDatesObject,
        lastUpdated: new Date().toISOString()
      };

      await update(availabilityRef, dataToSave);
      alert("Availability updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error updating availability:", error);
      alert("Error updating availability. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-md p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Set Availability - {doctor.fullName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Weekly Schedule */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Weekly Schedule</h3>
          {daysOfWeek.map(day => (
            <div key={day} className="mb-4 border border-gray-200 rounded-md p-4">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id={day}
                  checked={availabilityData[day].enabled}
                  onChange={() => toggleDayEnabled(day)}
                  className="mr-3"
                />
                <label htmlFor={day} className="font-medium capitalize">
                  {day}
                </label>
              </div>
              
              {availabilityData[day].enabled && (
                <div className="ml-6">
                  {availabilityData[day].timeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center space-x-3 mb-2">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(day, index, 'startTime', e.target.value)}
                        className="border border-gray-300 rounded px-3 py-1"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimeSlot(day, index, 'endTime', e.target.value)}
                        className="border border-gray-300 rounded px-3 py-1"
                      />
                      <button
                        onClick={() => removeTimeSlot(day, index)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addTimeSlot(day)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Add Time Slot
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Specific Dates */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Specific Dates</h3>
          
          {/* Add new specific date */}
          <div className="mb-4 border border-gray-200 rounded-md p-4">
            <div className="flex items-center space-x-3 mb-3">
              <input
                type="date"
                value={newSpecificDate.date}
                onChange={(e) => setNewSpecificDate(prev => ({ ...prev, date: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-1"
              />
              <button
                onClick={addSpecificDate}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                Add Date
              </button>
            </div>
          </div>

          {/* List specific dates */}
          {specificDates.map((dateItem, dateIndex) => (
            <div key={dateIndex} className="mb-4 border border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">{dateItem.date}</h4>
                <button
                  onClick={() => removeSpecificDate(dateIndex)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                >
                  Remove Date
                </button>
              </div>
              
              {dateItem.timeSlots.map((slot, slotIndex) => (
                <div key={slotIndex} className="flex items-center space-x-3 mb-2 ml-4">
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSpecificDateTimeSlot(dateIndex, slotIndex, 'startTime', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSpecificDateTimeSlot(dateIndex, slotIndex, 'endTime', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1"
                  />
                  <button
                    onClick={() => removeSpecificDateTimeSlot(dateIndex, slotIndex)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              <button
                onClick={() => addSpecificDateTimeSlot(dateIndex)}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 ml-4"
              >
                Add Time Slot
              </button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-300 text-black px-6 py-2 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700"
          >
            Save Availability
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityModal;