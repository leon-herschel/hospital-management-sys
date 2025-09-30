import React, { useState, useEffect } from "react";
import { ref, get, update } from "firebase/database";
import { database } from "../../../firebase/firebase";
import SuccessModal from "./ProfessionalFeeSuccessModal"; // Import the success modal
import ProfessionalFeeSuccessModal from "./ProfessionalFeeSuccessModal";

const ProfessionalFeeModal = ({ doctor, onClose }) => {
  const [consultationFee, setConsultationFee] = useState("");
  const [followUpFee, setFollowUpFee] = useState("");
  const [referralFee, setReferralFee] = useState("");
  const [patronageFee, setPatronageFee] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch existing fees when modal opens
  useEffect(() => {
    const fetchFees = async () => {
      if (!doctor?.id) return;
      setLoading(true);
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
      } finally {
        setLoading(false);
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

    setSaving(true);
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
      
      // Show success modal instead of alert
      setShowSuccessModal(true);
      
    } catch (err) {
      console.error("Error saving fees:", err);
      alert(`Failed to save fees: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onClose(); // Close the main modal after success
  };

  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Professional Fees</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {doctor?.name && (
              <p className="text-sm text-gray-600 mt-1">Setting fees for Dr. {doctor.name}</p>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                <span className="ml-3 text-gray-600">Loading current fees...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Consultation Fee */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Consultation Fee
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Follow-up Fee */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Follow-up Fee
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={followUpFee}
                      onChange={(e) => setFollowUpFee(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Referral Fee */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Referral Fee
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={referralFee}
                      onChange={(e) => setReferralFee(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Patronage Fee */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Patronage Fee
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={patronageFee}
                      onChange={(e) => setPatronageFee(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <ProfessionalFeeSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Fees Updated!"
        message="Professional fees have been saved successfully."
        autoCloseDelay={3000}
      />
    </>
  );
};

export default ProfessionalFeeModal;