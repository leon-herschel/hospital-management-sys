import { useState, useEffect } from "react";
import { ref, onValue, remove, update } from "firebase/database";
import { database } from "../../firebase/firebase";
import DeleteConfirmationModal from "./DeleteConfirmationModalBooking";
import EditBookingModal from "./EditBookingModal";
import AddBooking from "./AddBooking";

function Booking() {
  const [bookingList, setBookingList] = useState([]);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const bookingRef = ref(database, "Appointments/Patients");
    const unsubscribe = onValue(bookingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bookings = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        bookings.sort((a, b) =>
          a.patient?.name?.localeCompare(b.patient?.name)
        );
        setBookingList(bookings);
      } else {
        setBookingList([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleModal = () => setModal(!modal);
  const toggleEditModal = () => setEditModal(!editModal);
  const toggleDeleteModal = () => setDeleteModal(!deleteModal);

  const handleDeleteConfirmation = (booking) => {
    setCurrentBooking(booking);
    toggleDeleteModal();
  };

  const handleDelete = async () => {
    if (currentBooking) {
      await remove(ref(database, `Appointments/Patients/${currentBooking.id}`));
      toggleDeleteModal();
    }
  };

  const handleEdit = (booking) => {
    setCurrentBooking(booking);
    toggleEditModal();
  };

  const handleUpdate = async (updatedBooking) => {
    await update(ref(database, `Appointments/Patients/${currentBooking.id}`), updatedBooking);
    toggleEditModal();
  };

  const filteredBookings = bookingList.filter((booking) =>
    booking.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <input
          type="text"
          placeholder="Search by patient name"
          className="border border-slate-300 px-4 py-2 rounded-md w-full md:w-1/3"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          onClick={toggleModal}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md w-full md:w-auto"
        >
          + Add Booking
        </button>
      </div>

      <div className="relative overflow-x-auto rounded-lg shadow">
        <table className="w-full text-sm text-gray-900 border border-slate-300">
          <thead className="text-md bg-slate-100 font-semibold text-left">
            <tr>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Complaints</th>
              <th className="px-4 py-3">Doctor</th>
              <th className="px-4 py-3">Date and Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="bg-white border-b hover:bg-slate-50 transition-all"
                >
                  <td className="px-4 py-3">{booking.patient?.name}</td>
                  <td className="px-4 py-3">{booking.patient?.phone}</td>
                  <td className="px-4 py-3">{booking.patient?.address}</td>
                  <td className="px-4 py-3">
                    <ul className="list-disc ml-4 text-sm space-y-1 text-gray-700">
                      {booking.patient?.complaints?.filter(Boolean).map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3">{booking.doctor}</td>
                  <td className="px-4 py-3">
                    {new Date(`${booking.date} ${booking.time}`).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                    <br />
                    {new Date(booking.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full
                      ${booking.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                      }`}>
                      {booking.status || "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex flex-col gap-2">
                    <button
                      onClick={() => handleEdit(booking)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteConfirmation(booking)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center px-6 py-4 text-gray-500">
                  No Bookings Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal && <AddBooking isOpen={modal} toggleModal={toggleModal} />}
      <DeleteConfirmationModal
        isOpen={deleteModal}
        toggleModal={toggleDeleteModal}
        onConfirm={handleDelete}
      />
      <EditBookingModal
        isOpen={editModal}
        toggleModal={toggleEditModal}
        currentBooking={currentBooking}
        handleUpdate={handleUpdate}
      />
    </div>
  );
}

export default Booking;
