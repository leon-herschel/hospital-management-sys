// DeleteConfirmationModal.js
import React from 'react';

function DeleteConfirmationModal({ isOpen, toggleModal, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-2/3 md:w-1/2 lg:w-1/3">
        <h2 className="text-lg font-bold mb-4">Delete Confirmation</h2>
        <p>Are you sure you want to delete this patient?</p>
        <div className="flex justify-end mt-4">
          <button
            onClick={toggleModal}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200 mr-2"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm} // Calls the deletion function when confirmed
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;
