import React, { useState } from "react";

const LabResultsModal = ({ isOpen, onClose, onSave }) => {
  const [labTitle, setLabTitle] = useState("");
  const [labDate, setLabDate] = useState("");
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    if (!labTitle || !labDate || !file) {
      alert("Please fill out all fields and select a file.");
      return;
    }

    onSave({ labTitle, labDate, file });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Add Laboratory Result</h2>

        <div className="space-y-3">
          <div>
            <label className="block mb-1 font-medium">Test Title</label>
            <input
              type="text"
              value={labTitle}
              onChange={(e) => setLabTitle(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 rounded-md"
              placeholder="e.g., CBC Result"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Date</label>
            <input
              type="date"
              value={labDate}
              onChange={(e) => setLabDate(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 rounded-md"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full"
            />
          </div>
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

export default LabResultsModal;
