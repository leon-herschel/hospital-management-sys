import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, get, update } from 'firebase/database';
import { database } from '../../firebase/firebase';
import jsPDF from 'jspdf';

const ViewBill = ({ billing, patients, onClose }) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [inventoryHistory, setInventoryHistory] = useState([]);
  const [medicineList, setMedicineList] = useState([]);
  const [supplyList, setSupplyList] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(Number(billing.amount) || 0); // Ensure it's a number
  const navigate = useNavigate();

  useEffect(() => {
    if (billing) {
      setPaymentMethod(billing.paymentMethod || '');
      setPaymentDate(billing.paymentDate || '');

      // Fetch item history for both medicines and supplies
      const fetchItemHistory = async () => {
        const itemHistoryRef = ref(database, 'itemHistory');
        const snapshot = await get(itemHistoryRef);
        if (snapshot.exists()) {
          const itemHistoryList = [];
          snapshot.forEach((childSnapshot) => {
            itemHistoryList.push({ id: childSnapshot.key, ...childSnapshot.val() });
          });

          // Fetch retail prices from medicines
          const medicineHistoryRef = ref(database, 'medicine');
          const medicineSnapshot = await get(medicineHistoryRef);
          const updatedMedicineList = itemHistoryList.map((item) => {
            const medicineItem = medicineSnapshot.child(item.id).val();
            return {
              ...item,
              retailPrice: medicineItem ? medicineItem.retailPrice : 0, // Fetch price from medicine node
            };
          });
          setMedicineList(updatedMedicineList);

          // Fetch retail prices from supplies
          const suppliesHistoryRef = ref(database, 'supplies');
          const suppliesSnapshot = await get(suppliesHistoryRef);
          const updatedSupplyList = itemHistoryList.map((item) => {
            const supplyItem = suppliesSnapshot.child(item.id).val();
            return {
              ...item,
              retailPrice: supplyItem ? supplyItem.retailPrice : 0, // Fetch price from supplies node
            };
          });
          setSupplyList(updatedSupplyList);
        }
      };

      fetchItemHistory();
    }
  }, [billing]);

  useEffect(() => {
    // Calculate subtotal for medicines
    const medicineSubtotal = medicineList.reduce((acc, item) => {
      return acc + (item.retailPrice * item.quantity || 0);
    }, 0);

    // Calculate subtotal for supplies
    const supplySubtotal = supplyList.reduce((acc, item) => {
      return acc + (item.retailPrice * item.quantity || 0);
    }, 0);

    // Calculate total amount and subtotal
    const total = Number(medicineSubtotal) + Number(supplySubtotal);
    setSubtotal(total);
    setTotalAmount(total); // Ensure totalAmount is always a number

    // Update the billing amount
    if (billing) {
      const billingRef = ref(database, `billing/${billing.id}`);
      update(billingRef, { amount: total });
    }
  }, [medicineList, supplyList, billing]);

  const handleUpdatePayment = async () => {
    if (!paymentMethod || !paymentDate) {
      alert('Please fill out all fields');
      return;
    }

    const billingRef = ref(database, `billing/${billing.id}`);
    await update(billingRef, {
      paymentMethod,
      paymentDate,
      status: 'Paid',
    });

    alert('Payment details updated successfully!');
    onClose();
    navigate('/billing');
  };

  const handleGenerateReceipt = () => {
    const doc = new jsPDF();

    // Set document title and some styles
    doc.setFontSize(20);
    doc.text('Receipt', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Patient Name: ${patients[billing.patientId]}`, 10, 30);
    doc.text(`Bill Amount: ${totalAmount.toFixed(2)} `, 10, 40); // Formatting total amount as currency
    doc.text(`Status: ${billing.status}`, 10, 50);
    doc.text(`Payment Method: ${paymentMethod}`, 10, 60);
    doc.text(`Payment Date: ${paymentDate}`, 10, 70);

    // Medicines Section
    doc.text('Medicines Used:', 10, 90);
    let y = 100; // Start y position for medicines
    medicineList.forEach((item) => {
      const itemSubtotal = item.retailPrice * item.quantity;
      doc.text(`- ${item.itemName} (Quantity: ${item.quantity}, Price: ${item.retailPrice.toFixed(2)} pesos, Subtotal: ${itemSubtotal.toFixed(2)}) pesos`, 10, y);
      y += 10; // Increase y position for the next item
    });

    // Supplies Section
    doc.text('Supplies Used:', 10, y + 10);
    y += 20; // Adjust for heading space
    supplyList.forEach((item) => {
      const itemSubtotal = item.retailPrice * item.quantity;
      doc.text(`- ${item.itemName} (Quantity: ${item.quantity}, Price: ${item.retailPrice.toFixed(2)} pesos, Subtotal: ${itemSubtotal.toFixed(2)}) pesos`, 10, y);
      y += 10; // Increase y position for the next item
    });

    // Total Amount Section
    doc.text(`Total Amount: ${typeof totalAmount === 'number' ? totalAmount.toFixed(2) : 'N/A'} pesos`, 10, y + 20);

    // Save the PDF
    doc.save(`receipt_${billing.id}.pdf`);
  };

  if (!billing) {
    return <div>Loading...</div>;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Billing Details</h2>
        <p><strong>Patient Name:</strong> {patients[billing.patientId]}</p>
        <p><strong>Bill Amount:</strong> ₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(totalAmount)}</p>
        <p><strong>Status:</strong> {billing.status}</p>

        {/* Displaying Medicines Table */}
        {medicineList.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Medicines Used:</h3>
            <table className="min-w-full border-collapse border border-gray-300 mt-2">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2">Item Name</th>
                  <th className="border border-gray-300 px-4 py-2">Quantity</th>
                  <th className="border border-gray-300 px-4 py-2">Price</th>
                  <th className="border border-gray-300 px-4 py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {medicineList.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 px-4 py-2">{item.itemName}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2">₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(item.retailPrice)}</td>
                    <td className="border border-gray-300 px-4 py-2">₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(item.retailPrice * item.quantity)}</td> </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Displaying Supplies Table */}
        {supplyList.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Supplies Used:</h3>
            <table className="min-w-full border-collapse border border-gray-300 mt-2">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2">Item Name</th>
                  <th className="border border-gray-300 px-4 py-2">Quantity</th>
                  <th className="border border-gray-300 px-4 py-2">Price</th>
                  <th className="border border-gray-300 px-4 py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {supplyList.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 px-4 py-2">{item.itemName}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2">₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(item.retailPrice)}</td>
                    <td className="border border-gray-300 px-4 py-2">₱{new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(item.retailPrice * item.quantity)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4">
          <label className="block mb-2 font-semibold">Payment Method:</label>
          <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="border border-gray-300 rounded p-2 w-full mb-4"
              >
            <option value="">Select Payment Method</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Mobile Payment">Mobile Payment</option>
            </select>
          <label className="block mb-2 font-semibold">Payment Date:</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="border border-gray-300 rounded p-2 w-full mb-4"
          />
          <button
            onClick={handleUpdatePayment}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Update Payment
          </button>
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
