import React, { useState } from "react";

const Request = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleDetails = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="max-w-full mx-auto mt-6 bg-white rounded-lg shadow-lg">
      <div className="border-b p-4">
        <div className="flex justify-between items-center">
          <p className="font-bold text-lg">
            A stock transfer requested by{" "}
            <span className="text-primary">Pharmacy</span>
          </p>
          <button onClick={toggleDetails} className="focus:outline-none">
            {isExpanded ? (
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
      </div>

      {isExpanded && (
        <div className="p-4 bg-gray-100">
          <ul className="list-disc pl-5">
            <li>
              <strong>Requested by:</strong> Analyn
            </li>
            <li>
              <strong>Items Requested:</strong> Biogesic Ingat
            </li>
            <li>
              <strong>Quantity Requested:</strong> 75
            </li>
            <li>
              <strong>Request Date:</strong> 11-02-24 12:00 pm
            </li>
            <li>
              <strong>Reason for Request:</strong> Urgent need for stock
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Request;
