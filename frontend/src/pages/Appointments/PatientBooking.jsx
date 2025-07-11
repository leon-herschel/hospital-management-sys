// /src/pages/PatientBooking.jsx

import { useEffect, useState } from "react";
import { ref, push, set, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";

function PatientBooking() {
  const [form, setForm] = useState({
    name: "",
    phone: "+63",
    address: "",
    complaints: [""],
    doctor: "",
    date: "",
    time: ""
  });
  const [doctorList, setDoctorList] = useState([]);
  const [bookedDates, setBookedDates] = useState([]);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMonthOffset, setViewMonthOffset] = useState(0);
  const [manualConflict, setManualConflict] = useState("");

  const doctorAvailability = {
    "Dr. A": ["10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM"],
    "Dr. B": ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "04:00 PM"],
    default: [
      "09:00 AM", "10:00 AM", "11:00 AM",
      "12:00 PM", "01:00 PM", "02:00 PM",
      "03:00 PM", "04:00 PM", "05:00 PM"
    ]
  };

  useEffect(() => {
    const docRef = ref(database, "Appointments/Doctors");
    const patRef = ref(database, "Appointments/Patients");

    onValue(docRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.values(data).map((entry) => entry.Name);
        setDoctorList(list);
      }
    });

    onValue(patRef, (snap) => {
      const data = snap.val();
      const dates = data ? Object.values(data).map((e) => e.date?.split("-")[2]) : [];
      setBookedDates(dates.map(Number));
    });
  }, []);

  useEffect(() => {
    if (!form.date || !form.doctor) return;
    const patRef = ref(database, "Appointments/Patients");
    onValue(patRef, (snap) => {
      const data = snap.val();
      const matched = Object.values(data || {}).filter(
        (entry) => entry.date === form.date && entry.doctor === form.doctor
      );
      const times = matched.map((e) => e.time);
      setBookedTimes(times);
    });
  }, [form.date, form.doctor]);

  useEffect(() => {
    const allowed = getDoctorSlots();
    if (form.time && !allowed.includes(form.time)) {
      setManualConflict("⛔ Time is not available for this doctor or already booked");
    } else if (bookedTimes.includes(form.time)) {
      setManualConflict("⛔ Time already booked. Please select another.");
    } else {
      setManualConflict("");
    }
  }, [form.time, bookedTimes, form.doctor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhone = (e) => {
    let val = e.target.value;
    if (val.startsWith("+63")) val = "+63" + val.substring(3).replace(/\D/g, "");
    if (val.length > 13) val = val.slice(0, 13);
    if (val.length >= 3) setForm((p) => ({ ...p, phone: val }));
  };

  const addComplaint = () => {
    setForm((p) => ({ ...p, complaints: [...p.complaints, ""] }));
  };

  const handleComplaintChange = (i, v) => {
    const updated = [...form.complaints];
    updated[i] = v;
    setForm((p) => ({ ...p, complaints: updated }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (!form.phone || form.phone.length !== 13) e.phone = true;
    if (!form.address.trim()) e.address = true;
    if (!form.complaints.filter((c) => c.trim()).length) e.complaints = true;
    if (!form.date) e.date = true;
    if (!form.time || manualConflict) e.time = true;
    if (!form.doctor.trim()) e.doctor = true;
    return e;
  };

  const handleSubmit = async () => {
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    setSubmitting(true);

    try {
      const newRef = push(ref(database, "Appointments/Patients"));
      const id = newRef.key;

      await set(newRef, {
        patient: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          complaints: form.complaints,
        },
        doctor: form.doctor,
        date: form.date,
        time: form.time
      });

      if (!doctorList.includes(form.doctor)) {
        await set(push(ref(database, "Appointments/Doctors")), { Name: form.doctor });
      }

      alert("✅ Appointment booked!");
      setForm({ name: "", phone: "+63", address: "", complaints: [""], doctor: "", date: "", time: "" });
      setSelectedDay(null);
      setErrors({});
    } catch (err) {
      alert("❌ " + err.message);
    }

    setSubmitting(false);
  };

  const now = new Date();
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() + viewMonthOffset);
  const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1).getDay();
  const currentMonth = baseDate.toLocaleDateString("en-US", { month: "long" });
  const currentYear = baseDate.getFullYear();
  const monthStr = String(baseDate.getMonth() + 1).padStart(2, "0");

  const isToday = (year, month, day) => {
    const d = new Date(year, month, day);
    return d.toDateString() === new Date().toDateString();
  };

  const selectDate = (day) => {
    const selectedFullDate = new Date(currentYear, baseDate.getMonth(), day);
    if (selectedFullDate < new Date().setHours(0, 0, 0, 0) && !isToday(currentYear, baseDate.getMonth(), day)) return;
    const date = `${currentYear}-${monthStr}-${String(day).padStart(2, "0")}`;
    setForm((p) => ({ ...p, date }));
    setSelectedDay(day);
  };

  const getDoctorSlots = () => {
    const doc = form.doctor.trim();
    return doctorAvailability[doc] || doctorAvailability.default;
  };

  const inputStyle = (field) => `w-full mb-2 p-2 rounded border ${errors[field] ? "border-red-500" : "border-gray-300"}`;

  const renderDoctorAvatar = () => {
    const name = form.doctor.trim();
    if (!name) return <div className="w-24 h-24 bg-gray-300 rounded-full mt-4" />;
    const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    return (
      <div className="w-24 h-24 rounded-full bg-blue-500 text-white flex items-center justify-center mt-4 text-xl font-bold">
        {initials}
      </div>
    );
  };

  const slots = getDoctorSlots();

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <div className="bg-teal-600 text-white text-center py-4 shadow">
        <h1 className="text-2xl font-bold">Book an Appointment</h1>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        <div className="bg-gray-50 p-4 rounded-lg shadow space-y-3">
          <h2 className="text-lg font-semibold">Patient Information</h2>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" className={inputStyle("name")} />
          <input name="phone" value={form.phone} onChange={handlePhone} placeholder="Phone (+63)" className={inputStyle("phone")} />
          <input name="address" value={form.address} onChange={handleChange} placeholder="Address" className={inputStyle("address")} />

          <h3 className="font-medium mt-4">Complaints</h3>
          {form.complaints.map((c, i) => (
            <input
              key={i}
              value={c}
              onChange={(e) => handleComplaintChange(i, e.target.value)}
              className={inputStyle("complaints")}
              placeholder={`Complaint ${i + 1}`}
            />
          ))}
          <button onClick={addComplaint} className="text-sm text-blue-600">+ Add Complaint</button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg shadow text-center">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => setViewMonthOffset((v) => v - 1)} className="text-lg font-bold">◀</button>
            <h2 className="text-lg font-semibold">{currentMonth.toUpperCase()} {currentYear}</h2>
            <button onClick={() => setViewMonthOffset((v) => v + 1)} className="text-lg font-bold">▶</button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="font-bold text-sm">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dayDate = new Date(currentYear, baseDate.getMonth(), day);
              const isPastDay = dayDate < new Date().setHours(0, 0, 0, 0) && !isToday(currentYear, baseDate.getMonth(), day);
              return (
                <div
                  key={day}
                  className={`rounded-full w-8 h-8 flex items-center justify-center
                    ${isPastDay ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-green-400 text-white cursor-pointer"}
                    ${selectedDay === day ? "ring-2 ring-black" : ""}`}
                  onClick={() => !isPastDay && selectDate(day)}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {form.date && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Select Time:</label>
              <input
                list="time-options"
                name="time"
                value={form.time}
                onChange={handleChange}
                className="w-full p-2 rounded border"
                placeholder="e.g. 10:00 AM"
              />
              <datalist id="time-options">
                {slots.map((slot) => (
                  <option key={slot} value={slot} />
                ))}
              </datalist>
              <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                {slots.map((slot) => (
                  <div
                    key={slot}
                    className={`px-2 py-1 rounded-full text-center ${bookedTimes.includes(slot) ? "bg-red-400 text-white" : "bg-green-400 text-white"}`}
                  >
                    {slot}
                  </div>
                ))}
              </div>
              {manualConflict && <p className="text-red-600 text-sm mt-1">{manualConflict}</p>}
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg shadow flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-4">Choose Doctor</h2>
          <input
            list="doctors"
            value={form.doctor}
            onChange={(e) => setForm((p) => ({ ...p, doctor: e.target.value }))}
            placeholder="Doctor name"
            className={inputStyle("doctor") + " text-center"}
          />
          <datalist id="doctors">
            {doctorList.map((d, i) => (
              <option key={i} value={d} />
            ))}
          </datalist>
          {renderDoctorAvatar()}
          <h3 className="font-semibold mt-2">{form.doctor && `Dr. ${form.doctor}`}</h3>
        </div>
      </div>

      <div className="flex justify-end max-w-6xl mx-auto px-6 pb-10">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg shadow"
        >
          {submitting ? "Booking..." : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}

export default PatientBooking;
