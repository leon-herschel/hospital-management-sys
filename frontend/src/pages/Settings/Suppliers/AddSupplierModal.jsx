import React, { useState } from "react";
import { ref, push, set } from "firebase/database";
import { database } from "../../../firebase/firebase";

const AddSupplierModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.contactPerson) {
      alert("Supplier name and contact person are required.");
      return;
    }

    const newRef = push(ref(database, "suppliers"));
    await set(newRef, {
      ...form,
      createdAt: new Date().toISOString(),
    });

    onClose();
    setForm({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Add Supplier</h2>

        <div className="space-y-3">
          <input
            type="text"
            name="name"
            placeholder="Supplier Name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
          />
          <input
            type="text"
            name="contactPerson"
            placeholder="Contact Person"
            value={form.contactPerson}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-md"
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSupplierModal;
