import { useState } from "react";
import { ref, push, set } from "firebase/database";
import jsPDF from "jspdf";
import QRCode from "qrcode";

function AddPatient({ isOpen, toggleModal }) {
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState("");
  const [roomType, setRoomType] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [medUse, setMedUse] = useState("");
  const [suppliesUsed, setSuppliesUsed] = useState("");

  const generatePDF = async (patientInfo) => {
    const doc = new jsPDF();

    doc.text(`Name: ${patientInfo.name}`, 90, 20);
    doc.text(`Date of Birth: ${patientInfo.birth}`, 90, 30);
    doc.text(`Contact: ${patientInfo.contact}`, 90, 40);
    doc.text(`Status: ${patientInfo.status}`, 90, 50);
    doc.text(`Room Type: ${patientInfo.roomType}`, 90, 60);

    const qrCodeDataUrl = await QRCode.toDataURL(patientInfo.qrData, {
      width: 100,
    });

    doc.addImage(qrCodeDataUrl, "PNG", 10, 0, 80, 80);

    doc.output("dataurlnewwindow");
  };

  const handlesubmit = () => {
    if (!name || !birth || !contact || !status || !roomType) {
      alert("Please fill in all required fields");
      return;
    }

    if (contact.length !== 11) {
      alert("Contact Number is invalid");
      return;
    }

    const patientRef = ref(database, "patient");
    const newPatientRef = push(patientRef);
    const uniqueKey = newPatientRef.key;

    const patientInfo = {
      name: name,
      birth: birth,
      contact: contact,
      status: status,
      roomType: roomType,
      diagnosis: diagnosis,
      medUse: medUse,
      suppliesUsed: suppliesUsed,
      qrData: uniqueKey,
    };

    set(newPatientRef, patientInfo)
      .then(() => {
        alert("Patient has been added successfully!");

        generatePDF(patientInfo);

        toggleModal();
        setName("");
        setBirth("");
        setContact("");
        setStatus("");
        setRoomType("");
      })
      .catch((error) => {
        alert("Error adding patient: ", error);
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
          onClick={toggleModal}
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-6">Add New Patient</h2>

        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="dateofbirth" className="block text-gray-700 mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            id="dateofbirth"
            name="dateofbirth"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="contact" className="block text-gray-700 mb-2">
            Contact Number
          </label>
          <input
            type="number"
            id="contact"
            name="contact"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="status" className="block text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="" disabled>
              Select Status
            </option>
            <option value="Inpatient">Inpatient</option>
            <option value="Outpatient">Outpatient</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="roomType" className="block text-gray-700 mb-2">
            Type of Room
          </label>
          <select
            id="roomType"
            name="roomType"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
          >
            <option value="" disabled>
              Select Room
            </option>
            <option value="Private">Private</option>
            <option value="Public">Public</option>
          </select>
        </div>

        <button
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          onClick={handlesubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default AddPatient;
