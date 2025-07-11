import { useState, useEffect } from "react";
import { ref, push, set, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO, isSameDay } from "date-fns";

function AddBooking({ isOpen, toggleModal }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+63");
  const [address, setAddress] = useState("");
  const [complaints, setComplaints] = useState([""]);
  const [doctor, setDoctor] = useState("");
  const [doctorList, setDoctorList] = useState([]);
  const [date, setDate] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const doctorRef = ref(database, "Appointments/Doctors");
    return onValue(doctorRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.values(data).map((d) => d.Name) : [];
      setDoctorList(list);
    });
  }, []);

  useEffect(() => {
    const bookingRef = ref(database, "Appointments/Patients");
    return onValue(bookingRef, (snapshot) => {
      const data = snapshot.val();
      const dates = data
        ? Object.values(data)
            .map((b) => b.date)
            .filter(Boolean)
            .map((d) => parseISO(d))
        : [];
      setBookedDates(dates);
    });
  }, []);

  const handleComplaintChange = (index, value) => {
    const updated = [...complaints];
    updated[index] = value;
    setComplaints(updated);
  };

  const addComplaintField = () => {
    setComplaints([...complaints, ""]);
  };

  const validate = () => {
    const errs = {};
    if (!name) errs.name = true;
    if (!phone || phone.length !== 13) errs.phone = true;
    if (!address) errs.address = true;
    if (!complaints.filter(Boolean).length) errs.complaints = true;
    if (!date) errs.date = true;
    if (!doctor) errs.doctor = true;
    return errs;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);

    const newBookingRef = push(ref(database, "Appointments/Patients"));
    const bookingId = newBookingRef.key;

    const payload = {
      id: bookingId,
      patient: {
        name,
        phone,
        address,
        complaints,
      },
      date: date.toISOString().split("T")[0],
      doctor,
    };

    try {
      await set(newBookingRef, payload);

      if (doctor && !doctorList.includes(doctor)) {
        const newDoctorRef = push(ref(database, "Appointments/Doctors"));
        await set(newDoctorRef, { Name: doctor });
      }

      alert("✅ Booking saved successfully!");
      resetForm();
      toggleModal();
    } catch (error) {
      alert("❌ Error saving booking: " + error.message);
    }

    setSubmitting(false);
  };

  const resetForm = () => {
    setName("");
    setPhone("+63");
    setAddress("");
    setComplaints([""]);
    setDate(null);
    setDoctor("");
    setErrors({});
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value;
    if (val.startsWith("+63")) val = "+63" + val.substring(3).replace(/\D/g, "");
    if (val.length > 13) val = val.slice(0, 13);
    if (val.length >= 3) setPhone(val);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-2/3 md:w-1/2 lg:w-1/3 max-h-full overflow-y-auto relative">
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-xl"
          onClick={toggleModal}
          aria-label="Close"
        >
          &times;
        </button>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <h2 className="text-2xl font-bold mb-6 text-center">Add New Booking</h2>

          {/* Full Name */}
          <div className="mb-4">
            <label className="block mb-1">Full Name</label>
            <input
              className={`w-full border px-3 py-2 rounded ${errors.name ? "border-red-500" : "border-gray-300"}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
            {errors.name && <p className="text-red-500 text-sm">Name is required</p>}
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label className="block mb-1">Phone</label>
            <input
              className={`w-full border px-3 py-2 rounded ${errors.phone ? "border-red-500" : "border-gray-300"}`}
              value={phone}
              onChange={handlePhoneChange}
              disabled={submitting}
            />
            {errors.phone && <p className="text-red-500 text-sm">Valid phone required</p>}
          </div>

          {/* Address */}
          <div className="mb-4">
            <label className="block mb-1">Address</label>
            <input
              className={`w-full border px-3 py-2 rounded ${errors.address ? "border-red-500" : "border-gray-300"}`}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={submitting}
            />
            {errors.address && <p className="text-red-500 text-sm">Address is required</p>}
          </div>

          {/* Complaints */}
          <div className="mb-4">
            <label className="block mb-1">Complaints</label>
            {complaints.map((c, i) => (
              <input
                key={i}
                className={`w-full mb-2 border px-3 py-2 rounded ${errors.complaints && !c ? "border-red-500" : "border-gray-300"}`}
                value={c}
                onChange={(e) => handleComplaintChange(i, e.target.value)}
                disabled={submitting}
              />
            ))}
            <button
              type="button"
              className="text-sm text-blue-600"
              onClick={addComplaintField}
              disabled={submitting}
            >
              + Add more
            </button>
            {errors.complaints && <p className="text-red-500 text-sm">At least one complaint is required</p>}
          </div>

          {/* Appointment Date */}
          <div className="mb-4">
            <label className="block mb-1">Appointment Date</label>
            <DatePicker
              selected={date}
              onChange={(d) => setDate(d)}
              dayClassName={(d) =>
                bookedDates.some((bd) => isSameDay(bd, d)) ? "bg-red-200 text-red-700" : "bg-green-100"
              }
              className={`w-full border px-3 py-2 rounded ${errors.date ? "border-red-500" : "border-gray-300"}`}
              placeholderText="Select a date"
              disabled={submitting}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
            {errors.date && <p className="text-red-500 text-sm">Date is required</p>}
          </div>

          {/* Doctor */}
          <div className="mb-4">
            <label className="block mb-1">Doctor</label>
            <input
              list="doctors"
              className={`w-full border px-3 py-2 rounded ${errors.doctor ? "border-red-500" : "border-gray-300"}`}
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              placeholder="Select or type doctor"
              disabled={submitting}
            />
            <datalist id="doctors">
              {doctorList.map((doc, idx) => (
                <option key={idx} value={doc} />
              ))}
            </datalist>
            {errors.doctor && <p className="text-red-500 text-sm">Doctor is required</p>}
          </div>

          <div className="mb-4">
            <label className="block mb-1">Status</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={submitting}
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex justify-between space-x-4">
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Booking"}
            </button>
            <button
              type="button"
              onClick={toggleModal}
              className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBooking;
