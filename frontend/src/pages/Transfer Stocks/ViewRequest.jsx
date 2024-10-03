import React from 'react';
import { useLocation } from 'react-router-dom';

const ViewRequest = () => {
  const location = useLocation(); // Get the location object
  const { state } = location; // Access the state passed during navigation

  return (
    <div className="max-w-full mx-auto mt-6 bg-white rounded-lg shadow-lg p-4">
      <h2 className="font-bold text-xl mb-4">Request Details</h2>
      <ul className="list-disc pl-5">
        <li><strong>Requested by:</strong> {state.requestedBy}</li>
        <li><strong>Items Requested:</strong> {state.itemsRequested}</li>
        <li><strong>Quantity Requested:</strong> {state.quantityRequested}</li>
        <li><strong>Request Date:</strong> {state.requestDate}</li>
        <li><strong>Reason for Request:</strong> {state.reasonForRequest}</li>
      </ul>
    </div>
  );
};

export default ViewRequest;
