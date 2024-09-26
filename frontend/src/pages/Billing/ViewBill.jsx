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
  const [totalAmount, setTotalAmount] = useState(billing.amount || 0); // Initialize with billing amount
  const navigate = useNavigate();

  useEffect(() => {
    if (billing) {
      setPaymentMethod(billing.paymentMethod || '');
      setPaymentDate(billing.paymentDate || '');

      const fetchInventoryHistory = async () => {
        const inventoryHistoryRef = ref(database, 'inventoryHistory');
        const snapshot = await get(inventoryHistoryRef);
        if (snapshot.exists()) {
          const inventoryList = [];
          snapshot.forEach((childSnapshot) => {
            inventoryList.push({ id: childSnapshot.key, ...childSnapshot.val() });
          });
          setInventoryHistory(inventoryList);
        }
      };

      fetchInventoryHistory();
    }
  }, [billing]);

  useEffect(() => {
    const fetchSuppliesHistory = async () => {
      const suppliesHistoryRef = ref(database, 'supplies');
      const snapshot = await get(suppliesHistoryRef);
      if (snapshot.exists()) {
        const suppliesList = [];
        snapshot.forEach((childSnapshot) => {
          suppliesList.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setSupplyList(suppliesList);
      }
    };

    const fetchMedicineHistory = async () => {
      const medicineHistoryRef = ref(database, 'medicine');
      const snapshot = await get(medicineHistoryRef);
      if (snapshot.exists()) {
        const medicineList = [];
        snapshot.forEach((childSnapshot) => {
          medicineList.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setMedicineList(medicineList);
      }
    };

    if (inventoryHistory.length > 0) {
      fetchSuppliesHistory();
      fetchMedicineHistory();
    }
  }, [inventoryHistory]);

  useEffect(() => {
    // Calculate subtotal for medicines
    const medicineSubtotal = medicineList.reduce((acc, item) => {
      return acc + item.retailPrice * item.quantity;
    }, 0);

    // Calculate subtotal for supplies
    const supplySubtotal = supplyList.reduce((acc, item) => {
      return acc + item.retailPrice * item.quantity;
    }, 0);

    // Calculate total amount and subtotal
    const total = medicineSubtotal + supplySubtotal;
    setSubtotal(medicineSubtotal + supplySubtotal);
    setTotalAmount(total);

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
    doc.text(`Bill Amount: ₱${totalAmount.toFixed(2)}`, 10, 40); // Formatting total amount as currency
    doc.text(`Status: ${billing.status}`, 10, 50);
    doc.text(`Payment Method: ${paymentMethod}`, 10, 60);
    doc.text(`Payment Date: ${paymentDate}`, 10, 70);

    // Medicines Section
    doc.text('Medicines Used:', 10, 90);
    let y = 100; // Start y position for medicines
    medicineList.forEach((item) => {
      doc.text(`- ${item.itemName} (Quantity: ${item.quantity}, Price: ₱${item.retailPrice.toFixed(2)})`, 10, y);
      y += 10; // Increase y position for the next item
    });

    // Supplies Section
    doc.text('Supplies Used:', 10, y + 10);
    y += 20; // Adjust for heading space
    supplyList.forEach((item) => {
      doc.text(`- ${item.itemName} (Quantity: ${item.quantity}, Price: ₱${item.retailPrice.toFixed(2)})`, 10, y);
      y += 10; // Increase y position for the next item
    });

    // Total Amount Section
    doc.text(`Subtotal: ₱${subtotal.toFixed(2)}`, 10, y + 10);
    doc.text(`Total Amount: ₱${totalAmount.toFixed(2)}`, 10, y + 20);

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
        <p><strong>Bill Amount:</strong> ₱{totalAmount.toFixed(2)}</p>
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
                </tr>
              </thead>
              <tbody>
                {medicineList.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 px-4 py-2">{item.itemName}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2">₱{item.retailPrice.toFixed(2)}</td>
                  </tr>
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
                </tr>
              </thead>
              <tbody>
                {supplyList.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 px-4 py-2">{item.itemName}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2">₱{item.retailPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {medicineList.length === 0 && supplyList.length === 0 && (
          <p>No supply or medicine history available.</p>
        )}

        <div className="mt-4">
          <label htmlFor="paymentMethod" className="block mb-2">Payment Method:</label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
          >
            <option value="">Select Payment Method</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
          </select>
        </div>

        <div className="mt-4">
          <label htmlFor="paymentDate" className="block mb-2">Payment Date:</label>
          <input
            type="date"
            id="paymentDate"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
          />
        </div>

        <div className="mt-6 flex justify-between">
          <button
            className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600"
            onClick={handleUpdatePayment}
          >
            Update Payment
          </button>
          <button
            className="bg-green-500 text-white rounded-md px-4 py-2 hover:bg-green-600"
            onClick={handleGenerateReceipt}
          >
            Generate Receipt
          </button>
        </div>

        <button
          className="mt-4 text-red-500 hover:text-red-700"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewBill;
