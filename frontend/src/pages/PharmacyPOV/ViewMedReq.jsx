import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database'; // Use onValue for real-time updates
import { database } from '../../firebase/firebase'; // Import Firebase configuration
import ConfirmMedRequest from './ConfirmMedRequest'; // Import ConfirmMedRequest component
import AccessDenied from "../ErrorPages/AccessDenied";
import { useAuth } from "../../context/authContext/authContext";

const ViewMedReq = () => {
  const { department } = useAuth(); 
  const [requests, setRequests] = useState([]); // Store fetched requests
  const [expandedRequests, setExpandedRequests] = useState({}); // Track expanded state for each request
  const [requestToTransfer, setRequestToTransfer] = useState(null); // Track selected request for confirmation

  // Fetch Pharmacy data from Firebase in real-time
  useEffect(() => {
    const pharmacyRequestRef = ref(database, 'departments/Pharmacy/Request');

    const handleRequestUpdates = (snapshot) => {
      if (snapshot.exists()) {
        const requestsData = Object.values(snapshot.val()).map(request => ({
          ...request,
          department: 'Pharmacy',
        }));
        return requestsData;
      }
      return [];
    };

    // Listen for updates in Pharmacy requests
    const pharmacyListener = onValue(pharmacyRequestRef, (pharmacySnapshot) => {
      const pharmacyRequests = handleRequestUpdates(pharmacySnapshot);

      // Sort the pharmacy requests by timestamp (ascending order)
      pharmacyRequests.sort((a, b) => {
        const timestampA = new Date(a.timestamp).getTime();
        const timestampB = new Date(b.timestamp).getTime();
        return timestampA - timestampB;
      });

      // Set the requests state with real-time updates
      setRequests(pharmacyRequests);
    });

    // Cleanup listener when component unmounts
    return () => {
      pharmacyListener();
    };
  }, []);

  // Toggle details for a specific request
  const toggleDetails = (index) => {
    setExpandedRequests((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Handle confirm action (trigger transfer logic)
  const handleConfirm = (request) => {
    console.log("Confirmed request:", request);
    // Set the request to transfer
    setRequestToTransfer(request);
  };

  // Handle decline action
  const handleDecline = (request) => {
    console.log("Declined request:", request);
    // Add your decline logic here (e.g., update the database to mark the request as declined)
  };

  // Handle exit action to go back to the request list
  const handleExit = () => {
    setRequestToTransfer(null); // Reset the transfer request
  };

  if (department !== "Pharmacy" && department !== "Admin") {
    return <AccessDenied />;
  }

  return (
    <div className="max-w-full mx-auto mt-2 bg-white rounded-lg shadow-lg">
      {requestToTransfer ? (
        <div>
          {/* Exit button to return to the requests page */}
          <button
            onClick={handleExit}
            className="ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
          >
            Exit
          </button>
          {/* Show the ConfirmRequest component if a request is confirmed */}
          <ConfirmMedRequest requestToConfirm={requestToTransfer} />
        </div>
      ) : (
        <div className="max-w-full mx-auto mt-2 bg-white rounded-lg shadow-lg">
          {requests.length === 0 ? (
            <p className="p-4 text-center">No requests found.</p>
          ) : (
            requests.map((request, index) => (
              <div key={index} className="border-b p-4">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-lg">
                    A stock transfer requested by{' '}
                    <span className="text-primary">{request.name}</span>
                  </p>
                  <button
                    onClick={() => toggleDetails(index)}
                    className="focus:outline-none"
                  >
                    {expandedRequests[index] ? (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {expandedRequests[index] && (
                  <div className="p-4 bg-gray-100">
                    <ul className="list-disc pl-5">
                      <li><strong>Requested by:</strong> {request.name || 'N/A'}</li>
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
                    <div className="flex space-x-4 mt-4">
                      <button
                        onClick={() => handleConfirm(request)}
                        className="ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleDecline(request)}
                        className="ml-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ViewMedReq;
