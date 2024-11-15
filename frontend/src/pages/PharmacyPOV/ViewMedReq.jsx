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

  useEffect(() => {
    const pharmacyRequestRef = ref(database, 'departments/Pharmacy/Request');

    const handleRequestUpdates = (snapshot) => {
      if (snapshot.exists()) {
        const requestsData = Object.entries(snapshot.val()).map(([key, request]) => ({
          ...request,
          requestId: key, // Include the Firebase key in the request data
          department: 'Pharmacy',
        }));
        return requestsData;
      }
      return [];
    };

    const pharmacyListener = onValue(pharmacyRequestRef, (snapshot) => {
      const pharmacyRequests = handleRequestUpdates(snapshot);
      pharmacyRequests.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setRequests(pharmacyRequests);
    });

    return () => pharmacyListener();
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

  if (department !== "Pharmacy" && department !== "Admin") {
    return <AccessDenied />;
  }

  return (
    <div className="max-w-full mx-auto mt-2 bg-white rounded-lg shadow-lg">
      {requestToTransfer ? (
        <div>
          <button
            onClick={handleExit}
            className="ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
          >
            Exit
          </button>
          <ConfirmMedRequest
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
                    A medicine transfer requested by{' '}
                    <span className="text-primary">{request.currentDepartment}</span>
                  </p>
                  <button onClick={() => handleConfirm(request)} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
};

export default ViewMedReq;
