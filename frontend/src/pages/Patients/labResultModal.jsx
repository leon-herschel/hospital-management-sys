import React, { useState } from "react";
import { X, FileText, Calendar, Upload, Save } from "lucide-react";

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Add Laboratory Result</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <FileText className="w-4 h-4 text-gray-500" />
              <span>Test Title</span>
            </label>
            <input
              type="text"
              value={labTitle}
              onChange={(e) => setLabTitle(e.target.value)}
              className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
              placeholder="e.g., CBC Result"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>Date</span>
            </label>
            <input
              type="date"
              value={labDate}
              onChange={(e) => setLabDate(e.target.value)}
              className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Upload className="w-4 h-4 text-gray-500" />
              <span>Upload Image</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full border-2 border-dashed border-gray-200 px-4 py-6 rounded-xl hover:border-green-300 focus:border-green-500 transition-colors bg-gray-50 hover:bg-green-50/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
              />
              {file && (
                <div className="mt-2 text-sm text-gray-600 bg-green-50 p-2 rounded-lg">
                  Selected: {file.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 font-medium rounded-xl border border-gray-200 hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabResultsModal;