import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/firebase';
import ConfirmRequest from './ConfirmRequest';

const ViewRequest = () => {
  const [requests, setRequests] = useState([]);
  const [expandedRequests, setExpandedRequests] = useState({});
  const [requestToTransfer, setRequestToTransfer] = useState(null);

  useEffect(() => {
    const csrRequestRef = ref(database, 'departments/CSR/Request');

    const handleRequestUpdates = (snapshot, department) => {
      if (snapshot.exists()) {
        const requestsData = Object.entries(snapshot.val()).map(([key, request]) => ({
          ...request,
          requestId: key, // Include the Firebase key in the request data
          department,
        }));
        return requestsData;
      }
      return [];
    };

    const csrListener = onValue(csrRequestRef, (snapshot) => {
      const csrRequests = handleRequestUpdates(snapshot, 'CSR');
      csrRequests.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setRequests(csrRequests);
    });

    return () => csrListener();
  }, []);

  const handleConfirm = (request) => {
    setRequestToTransfer(request);
    setExpandedRequests((prev) => ({
      ...prev,
      [requests.indexOf(request)]: true,
    }));
  };

  const handleConfirmSuccess = () => {
    setRequestToTransfer(null); // Reset transfer request after successful confirmation
  };

  const handleExit = () => {
    setRequestToTransfer(null);
  };

  return (
    <div className="max-w-full mx-auto mt-6 bg-white rounded-lg shadow-lg">
      {requestToTransfer ? (
        <div>
          <button 
            onClick={handleExit} 
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Exit
          </button>
          <ConfirmRequest 
            requestToConfirm={requestToTransfer} 
            currentDepartment={requestToTransfer.currentDepartment}
            onConfirmSuccess={handleConfirmSuccess} // Pass success callback
          />
        </div>
      ) : (
        <>
          {requests.length === 0 ? (
            <p className="p-4 text-center">No requests found.</p>
          ) : (
            requests.map((request, index) => (
              <div key={index} className="border-b p-4">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-lg">
                    A stock transfer requested by <span className="text-primary">{request.name}</span>
                  </p>
                  <button onClick={() => handleConfirm(request)} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    View
                  </button>
                </div>
                {expandedRequests[index] && (
                  <div className="p-4 bg-gray-100">
                    <ul className="list-disc pl-5">
                      <li><strong>Requested by:</strong> {request.name || 'N/A'}</li>
                      <li><strong>Requested Department:</strong> {request.currentDepartment || 'N/A'}</li>
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
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
};

export default ViewRequest;
