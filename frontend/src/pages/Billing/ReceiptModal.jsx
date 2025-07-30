import React from 'react';

const ReceiptModal = ({ billing, patientDetails, onClose }) => {
  if (!billing || !patientDetails) return null;

  const medTotal = patientDetails.medUsed
    ? patientDetails.medUsed.reduce((sum, med) => sum + (med.price || 0), 0)
    : 0;
  const suppliesTotal = patientDetails.suppliesUsed
    ? patientDetails.suppliesUsed.reduce((sum, sup) => sum + (sup.price || 0), 0)
    : 0;
  const total = medTotal + suppliesTotal + (billing.amount || 0);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">Receipt</h2>
        <p><strong>Patient:</strong> {billing.patientName}</p>
        <p><strong>Date:</strong> {new Date(billing.timestamp).toLocaleDateString()}</p>
        <hr className="my-2" />
        <div>
          <h3 className="font-semibold">Medicines Used:</h3>
          <ul>
            {patientDetails.medUsed?.map((med, idx) => (
              <li key={idx}>{med.name} - ₱{med.price?.toFixed(2) || '0.00'}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Supplies Used:</h3>
          <ul>
            {patientDetails.suppliesUsed?.map((sup, idx) => (
              <li key={idx}>{sup.name} - ₱{sup.price?.toFixed(2) || '0.00'}</li>
            ))}
          </ul>
        </div>
        <hr className="my-2" />
        <p><strong>Other Charges:</strong> ₱{billing.amount?.toFixed(2) || '0.00'}</p>
        <p className="font-bold mt-2">Total: ₱{total.toFixed(2)}</p>
        <button onClick={onClose} className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-md">Close</button>
      </div>
    </div>
  );
};

export default ReceiptModal;