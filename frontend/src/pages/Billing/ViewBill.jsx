import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebase";
import jsPDF from "jspdf";

const ViewBill = ({ billing, onClose }) => {
  const [billingItems, setBillingItems] = useState([]);

  useEffect(() => {
    const billingRef = ref(database, `billing/${billing.id}`); // Using the unique key from the billing object

    const unsubscribeBilling = onValue(billingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Combine suppliesUsed and medsUsed into one array for billing items
        const suppliesUsed = data.suppliesUsed || [];
        const medsUsed = data.medsUsed || [];
        const items = [...suppliesUsed, ...medsUsed];

        setBillingItems(items.map((item, index) => ({ ...item, id: index }))); // Assign unique ID
      } else {
        setBillingItems([]);
      }
    });

    return () => unsubscribeBilling();
  }, [billing.id]);

  const handleGenerateReceipt = () => {
    const doc = new jsPDF();

    // Set document title and some styles
    doc.setFontSize(20);
    doc.text("Receipt", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Patient Name: ${billing.patientName}`, 10, 30);
    doc.text(
      `Total Amount: ${billing.amount ? billing.amount.toFixed(2) : "0.00"}`,
      10,
      40
    );
    doc.text(`Payment Status: ${billing.status}`, 10, 50);
    doc.text(
      `Date Paid: ${billing.presentDate ? billing.presentDate : "---"}`,
      10,
      60
    );
    // Items Section
    doc.text("Billing Items:", 10, 90);
    let y = 100; // Start y position for items
    billingItems.forEach((item) => {
      const price = item.retailPrice ? item.retailPrice.toFixed(2) : "0.00";
      const quantity = item.quantity || 0;
      const total = (item.retailPrice * quantity).toFixed(2); // Calculate total

      doc.text(
        `${item.name} (Qty: ${quantity}, Price: ${price} pesos, Total: ${total} pesos)`,
        10,
        y
      );
      y += 10; // Increase y position for the next item
    });

    // Save the PDF
    doc.save(`receipt_${billing.id}.pdf`);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Billing Details</h2>
        <div>
          <p>
            <strong>Patient Name:</strong> {billing.patientName}
          </p>
          <p>
            <strong>Total Amount:</strong> ₱
            {billing.amount ? billing.amount.toFixed(2) : "0.00"}
          </p>
          <p>
            <strong>Status:</strong> {billing.status}
          </p>
          <p>
            <strong>From:</strong> {billing.dateAdded}
          </p>
          <p>
            <strong>To:</strong>{" "}
            {billing.presentDate ? billing.presentDate : "---"}
          </p>
        </div>

        {/* Displaying Items Table */}
        {billingItems.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Items Used:</h3>
            <table className="min-w-full border-collapse border border-gray-300 mt-2">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2">
                    Item Name
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Quantity</th>
                  <th className="border border-gray-300 px-4 py-2">Price</th>
                  <th className="border border-gray-300 px-4 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {billingItems.map((item) => {
                  const price = item.retailPrice
                    ? item.retailPrice.toFixed(2)
                    : "0.00";
                  const quantity = item.quantity || 0;
                  const total = (item.retailPrice * quantity).toFixed(2); // Calculate total

                  return (
                    <tr key={item.id}>
                      <td className="border border-gray-300 px-4 py-2">
                        {item.name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {quantity}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        ₱{price}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        ₱{total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Items Used:</h3>
            <p className="text-gray-500 text-center">No usage found</p>
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={handleGenerateReceipt}
            className="bg-green-500 text-white px-4 py-2 rounded mr-2"
          >
            Generate Receipt
          </button>
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewBill;
