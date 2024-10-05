import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database"; // Use onValue for real-time updates
import { database } from "../../firebase/firebase"; // Import Firebase configuration

const Request = () => {
  const [requests, setRequests] = useState([]); // Store fetched requests
  const [expandedRequests, setExpandedRequests] = useState({}); // Track expanded state for each request

  // Fetch data from Firebase in real-time
  useEffect(() => {
    const csrRequestRef = ref(database, "departments/CSR/Request");
    const pharmacyRequestRef = ref(database, "departments/Pharmacy/Request");

    const handleRequestUpdates = (snapshot, department) => {
      if (snapshot.exists()) {
        const requestsData = Object.values(snapshot.val()).map((request) => ({
          ...request,
          department,
        }));
        return requestsData;
      }
      return [];
    };

    // Listen for updates in CSR requests
    const csrListener = onValue(csrRequestRef, (snapshot) => {
      const csrRequests = handleRequestUpdates(snapshot, "CSR");

      // Listen for updates in Pharmacy requests
      const pharmacyListener = onValue(
        pharmacyRequestRef,
        (pharmacySnapshot) => {
          const pharmacyRequests = handleRequestUpdates(
            pharmacySnapshot,
            "Pharmacy",
          );

          // Combine CSR and Pharmacy requests into one array
          const combinedRequests = [...csrRequests, ...pharmacyRequests];

          // Sort the combined requests by timestamp (ascending order)
          combinedRequests.sort((a, b) => {
            const timestampA = new Date(a.timestamp).getTime();
            const timestampB = new Date(b.timestamp).getTime();
            return timestampA - timestampB;
          });

          // Set the requests state with real-time updates
          setRequests(combinedRequests);
        },
      );

      // Cleanup listener when component unmounts
      return () => {
        csrListener();
        pharmacyListener();
      };
    });
  }, []);

  // Toggle details for a specific request
  const toggleDetails = (index) => {
    setExpandedRequests((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="max-w-full mx-auto mt-6 bg-white rounded-lg shadow-lg">
      {requests.length === 0 ? (
        <p className="p-4 text-center">No requests found.</p>
      ) : (
        requests.map((request, index) => (
          <div key={index} className="border-b p-4">
            <div className="flex justify-between items-center">
              <p className="font-bold text-lg">
                A stock transfer requested by{" "}
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
                  <li>
                    <strong>Requested by:</strong> {request.name || "N/A"}
                  </li>
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
                  <li>
                    <strong>Request Date:</strong> {request.timestamp || "N/A"}
                  </li>
                  <li>
                    <strong>Reason for Request:</strong>{" "}
                    {request.reason || "N/A"}
                  </li>
                </ul>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Request;
