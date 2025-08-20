import React, { useState, useEffect } from "react";
import { ref, get, update } from "firebase/database";
import { database } from "../../../firebase/firebase";

const ProfessionalFeeModal = ({ doctor, onClose }) => {
  const [consultationFee, setConsultationFee] = useState("");
  const [followUpFee, setFollowUpFee] = useState("");
  const [referralFee, setReferralFee] = useState("");
  const [patronageFee, setPatronageFee] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch existing fees when modal opens
  useEffect(() => {
    const fetchFees = async () => {
      if (!doctor?.id) return;
      try {
        const feeRef = ref(database, `doctors/${doctor.id}/professionalFees`);
        const snapshot = await get(feeRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setConsultationFee(data.consultationFee ?? "");
          setFollowUpFee(data.followUpFee ?? "");
          setReferralFee(data.referralFee ?? "");
          setPatronageFee(data.patronageFee ?? "");
        }
      } catch (err) {
        console.error("Error fetching fees:", err);
      }
    };

    fetchFees();
  }, [doctor]);

  const handleSave = async () => {
    if (!doctor?.id) {
      alert("Doctor ID missing. Cannot save fees.");
      return;
    }

    console.log("Saving fees for doctor ID:", doctor.id);
    console.log("Fees data:", {
      consultationFee: parseFloat(consultationFee || 0),
      followUpFee: parseFloat(followUpFee || 0),
      referralFee: parseFloat(referralFee || 0),
      patronageFee: parseFloat(patronageFee || 0),
    });

    setLoading(true);
    try {
      const feesData = {
        consultationFee: parseFloat(consultationFee || 0),
        followUpFee: parseFloat(followUpFee || 0),
        referralFee: parseFloat(referralFee || 0),
        patronageFee: parseFloat(patronageFee || 0),
      };

      const doctorRef = ref(database, `doctors/${doctor.id}`);
      
      // Check if doctor exists first
      const doctorSnapshot = await get(doctorRef);
      console.log("Doctor exists:", doctorSnapshot.exists());
      console.log("Doctor data:", doctorSnapshot.val());
      
      if (!doctorSnapshot.exists()) {
        console.error("Doctor record not found!");
        alert("Doctor record not found. Cannot save fees.");
        return;
      }

      // Update the professional fees
      const updateData = {
        professionalFees: feesData,
      };
      
      console.log("Updating with data:", updateData);
      await update(doctorRef, updateData);
      
      console.log("Professional fees updated successfully");
      alert("Professional fees saved!");
      onClose();
    } catch (err) {
      console.error("Error saving fees:", err);
      alert(`Failed to save fees: ${err.message}`);
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
          <input
            type="number"
            placeholder="Referral Fee"
            value={referralFee}
            onChange={(e) => setReferralFee(e.target.value)}
            className="w-full border px-4 py-2 rounded-md"
          />
          <input
            type="number"
            placeholder="Patronage Fee"
            value={patronageFee}
            onChange={(e) => setPatronageFee(e.target.value)}
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