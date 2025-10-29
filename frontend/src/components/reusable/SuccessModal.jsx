// src/components/modals/SuccessModal.jsx
import { useEffect } from "react";


const SuccessModal = ({ show, onClose, title = "Success!", message = "Action completed successfully." }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // auto close after 3s
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl text-center animate-fadeIn">
        <h2 className="text-2xl font-bold text-green-700 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
