import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database'; 
import { database } from '../../firebase/firebase'; 
import Modal from './transferModal'; // Import your Modal component
import Transfer from './Transfer'; // Ensure you import the Transfer component

const Request = ({ userId }) => {
  const [requests, setRequests] = useState([]);
  const [expandedRequests, setExpandedRequests] = useState({});
  const [currentDepartment, setCurrentDepartment] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal
  const [selectedItems, setSelectedItems] = useState([]);
  const [recipientDepartment, setRecipientDepartment] = useState(''); // State for recipient department

  // Fetch user's department
  useEffect(() => {
    if (userId) {
      const userRef = ref(database, `users/${userId}`);
      const userListener = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setCurrentDepartment(userData.department || 'N/A');
        } else {
          setCurrentDepartment('N/A');
        }
      });

      // Cleanup listener when component unmounts
      return () => {
        userListener();
      };
    }
  }, [userId]);

  // Fetch data from Firebase in real-time
  useEffect(() => {
    const csrRequestRef = ref(database, 'departments/CSR/Request');

    const handleRequestUpdates = (snapshot, department) => {
      if (snapshot.exists()) {
        const requestsData = Object.values(snapshot.val()).map(request => ({
          ...request,
          department,
        }));
        return requestsData;
      }
      return [];
    };

    // Listen for updates in CSR requests
    const csrListener = onValue(csrRequestRef, (snapshot) => {
      const csrRequests = handleRequestUpdates(snapshot, 'CSR');

      // Sort the requests by timestamp (ascending order)
      csrRequests.sort((a, b) => {
        const timestampA = new Date(a.timestamp).getTime();
        const timestampB = new Date(b.timestamp).getTime();
        return timestampA - timestampB;
      });

      // Set the requests state with real-time updates
      setRequests(csrRequests);
    });

    // Cleanup listener when component unmounts
    return () => {
      csrListener();
    };
  }, []);

  // Toggle details for a specific request
  const toggleDetails = (index) => {
    setExpandedRequests((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Handle proceed action
  const handleProceed = (request) => {
    // Set the selected items based on the request
    const itemsToTransfer = request.items.map(item => ({
      ...item,
      quantity: item.quantity || 1 // Set a default quantity if not defined
    }));

    setSelectedItems(itemsToTransfer);
    setRecipientDepartment(request.department); // Set the department from request
    setIsModalOpen(true); // Open the modal when proceeding
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItems([]); // Clear selected items when closing
    setRecipientDepartment(''); // Clear recipient department when closing
  };

  return (
    <div className="max-w-full mx-auto mt-2 bg-white rounded-lg shadow-lg">
      {requests.length === 0 ? (
        <p className="p-4 text-center">No requests found.</p>
      ) : (
        requests.map((request, index) => (
          <div key={index} className="border-b p-4">
            <div className="flex justify-between items-center">
              <p className="font-bold text-lg">
                A stock transfer requested by <span className="text-primary">{request.name}</span>
              </p>
              <button onClick={() => toggleDetails(index)} className="focus:outline-none">
                {expandedRequests[index] ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>

            {expandedRequests[index] && (
              <div className="p-4 bg-gray-100">
                <ul className="list-disc pl-5">
                  <li><strong>Requested by:</strong> {request.name || 'N/A'}</li>
                  <li><strong>Department:</strong> {request.department || currentDepartment || 'N/A'}</li>
                  {/* Map through items and display each one */}
                  {request.items && request.items.length > 0 ? (
                    request.items.map((item, i) => (
                      <li key={i}>
                        <strong>Item Requested:</strong> {item.itemName} <br />
                        <strong>Quantity Requested:</strong> {item.quantity}
                      </li>
                    ))
                  ) : (
                    <li>No items requested.</li>
                  )}
                  <li><strong>Request Date:</strong> {request.timestamp || 'N/A'}</li>
                  <li><strong>Reason for Request:</strong> {request.reason || 'N/A'}</li>
                </ul>
                <button onClick={() => handleProceed(request)} className="mt-4 bg-blue-500 text-white rounded px-4 py-2">
                  Proceed
                </button>
              </div>
            )}
          </div>
        ))
      )}
       {/* Modal to display the Transfer component */}
       <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <Transfer
          selectedItems={selectedItems}
          recipientDepartment={recipientDepartment} // Pass recipient department
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default Request;
