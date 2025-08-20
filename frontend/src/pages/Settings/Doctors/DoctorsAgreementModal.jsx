// src/components/Users/DoctorsAgreementModal.jsx
import { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { database } from "../../../firebase/firebase";

const DoctorsAgreementModal = ({ show, onClose, onAgree }) => {
  const [agreement, setAgreement] = useState(null);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (show) {
      const fetchAgreement = async () => {
        const snap = await get(ref(database, "agreement/doctors"));
        if (snap.exists()) {
          setAgreement(snap.val());
        }
      };
      fetchAgreement();
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-md p-6 w-full max-w-2xl max-h-screen overflow-y-auto shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        {agreement ? (
          <>
            <h2 className="text-2xl font-bold mb-4">{agreement.title}</h2>
            <div className="border p-4 rounded-md mb-4 bg-gray-50 max-h-64 overflow-y-auto">
              <p className="whitespace-pre-wrap">{agreement.content}</p>
            </div>
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mr-2"
              />
              I have read and agree to the terms above.
            </label>
            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (isChecked) {
                    onAgree();
                    onClose();
                  } else {
                    alert("Please agree to the terms before continuing.");
                  }
                }}
                className={`px-4 py-2 rounded-md ${
                  isChecked
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-400 text-gray-700 cursor-not-allowed"
                }`}
                disabled={!isChecked}
              >
                Agree
              </button>
            </div>
          </>
        ) : (
          <p>Loading agreement...</p>
        )}
      </div>
    </div>
  );
};

export default DoctorsAgreementModal;
