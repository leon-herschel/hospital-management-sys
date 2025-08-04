import React, { useState } from "react";
import { ref, update } from "firebase/database";
import { database } from "../../../firebase/firebase";

const ProfessionalFeeModal = ({ doctor, onClose }) => {
  const [consultationFee, setConsultationFee] = useState("");
  const [followUpFee, setFollowUpFee] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const feeRef = ref(database, `doctors/${doctor.id}/professionalFees`);
      await update(feeRef, {
        consultationFee: parseFloat(consultationFee || 0),
        followUpFee: parseFloat(followUpFee || 0),
      });
      alert("Professional fees saved!");
      onClose();
    } catch (err) {
      console.error("Error saving fees:", err);
      alert("Failed to save fees.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-center">Set Professional Fees</h2>

        <div className="space-y-4">
          <input
            type="number"
            placeholder="Consultation Fee"
            value={consultationFee}
            onChange={(e) => setConsultationFee(e.target.value)}
            className="w-full border px-4 py-2 rounded-md"
          />
          <input
            type="number"
            placeholder="Follow-up Fee"
            value={followUpFee}
            onChange={(e) => setFollowUpFee(e.target.value)}
            className="w-full border px-4 py-2 rounded-md"
          />
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalFeeModal;
