const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-md shadow-lg max-w-sm w-full">
          <h2 className="text-xl font-semibold mb-4">Confirm Logout</h2>
          <p className="mb-6">Are you sure you want to log out?</p>
          <div className="flex justify-end space-x-2">
            <button
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-md"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              onClick={onConfirm}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default LogoutConfirmationModal;