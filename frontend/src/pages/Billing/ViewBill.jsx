import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/firebase';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';


const ViewBill = ({ billing, onClose }) => {
  const [billingItems, setBillingItems] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [services, setServices] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // default is cash
  
  // New states for cash payment
  const [cashReceived, setCashReceived] = useState('');
  const [change, setChange] = useState(0);
  const [showChangeCalculator, setShowChangeCalculator] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  // Add state at the top
const [patientQrCode, setPatientQrCode] = useState('');

// Generate QR code for patientId
useEffect(() => {
  if (billing?.patientId) {
    QRCode.toDataURL(billing.patientId, { width: 100 })
      .then(url => setPatientQrCode(url))
      .catch(err => console.error('QR Code generation error:', err));
  } else {
    setPatientQrCode('');
  }
}, [billing?.patientId]);


  

  useEffect(() => {
    if (billing && billing.billedItems) {
      // Categorize the billed items
      const medicineItems = [];
      const supplyItems = [];
      const serviceItems = [];
      const consultationItems = [];

      billing.billedItems.forEach(item => {
        switch (item.itemType) {
          case 'medicine':
            medicineItems.push(item);
            break;
          case 'supply':
            supplyItems.push(item);
            break;
          case 'service':
            serviceItems.push(item);
            break;
          case 'consultation':
            consultationItems.push(item);
            break;
          default:
            // Default to medicine if type is unclear
            medicineItems.push(item);
        }
      });

      setMedicines(medicineItems);
      setSupplies(supplyItems);
      setServices(serviceItems);
      setConsultations(consultationItems);
      setBillingItems(billing.billedItems);
    }
  }, [billing]);

  // Calculate change when cash received changes
  useEffect(() => {
    if (cashReceived && !isNaN(cashReceived)) {
      const receivedAmount = parseFloat(cashReceived);
      const totalAmount = billing.amount || 0;
      const calculatedChange = receivedAmount - totalAmount;
      setChange(calculatedChange);
      
      // Clear any previous errors
      if (receivedAmount >= totalAmount) {
        setPaymentError('');
      } else {
        setPaymentError(`Insufficient amount. Need ₱${(totalAmount - receivedAmount).toFixed(2)} more.`);
      }
    } else {
      setChange(0);
      setPaymentError('');
    }
  }, [cashReceived, billing.amount]);

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === 'cash') {
      setShowChangeCalculator(true);
    } else {
      setShowChangeCalculator(false);
      setCashReceived('');
      setChange(0);
      setPaymentError('');
    }
  };

  const handleSimulateGCashPayment = () => {
    alert("Redirecting to GCash... (simulation)");
    
    // TODO: Replace this with actual GCash integration
    // Example: open a new tab with GCash payment link
  };

  // Quick amount buttons for cash received
  const handleQuickAmount = (amount) => {
    setCashReceived(amount.toString());
  };

  // Generate suggested amounts (round up to nearest denominations)
  const generateSuggestedAmounts = () => {
    const totalAmount = billing.amount || 0;
    const suggestions = [];
    
    // Exact amount
    suggestions.push(totalAmount);
    
    // Round up to nearest 50
    const roundTo50 = Math.ceil(totalAmount / 50) * 50;
    if (roundTo50 > totalAmount) suggestions.push(roundTo50);
    
    // Round up to nearest 100
    const roundTo100 = Math.ceil(totalAmount / 100) * 100;
    if (roundTo100 > totalAmount && roundTo100 !== roundTo50) suggestions.push(roundTo100);
    
    // Round up to nearest 500
    const roundTo500 = Math.ceil(totalAmount / 500) * 500;
    if (roundTo500 > totalAmount && roundTo500 !== roundTo100) suggestions.push(roundTo500);
    
    // Common large bills
    [1000, 2000, 5000].forEach(amount => {
      if (amount > totalAmount && !suggestions.includes(amount)) {
        suggestions.push(amount);
      }
    });
    
    return suggestions.slice(0, 4); // Return max 4 suggestions
  };

  const handleGenerateBIRReceipt = async () => {
    // Validate cash payment if cash method is selected
    if (paymentMethod === 'cash') {
      if (!cashReceived || isNaN(cashReceived)) {
        alert('Please enter the cash amount received.');
        return;
      }
      
      const receivedAmount = parseFloat(cashReceived);
      const totalAmount = billing.amount || 0;
      
      if (receivedAmount < totalAmount) {
        alert(`Insufficient cash received. Need ₱${(totalAmount - receivedAmount).toFixed(2)} more.`);
        return;
      }
    }

    const doc = new jsPDF();
    let y = 20;
doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(billing.clinicName || 'Cebu Doctors\' University Hospital', 105, y, { align: 'center' });
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Osmeña Boulevard, Cebu City, Philippines', 105, y, { align: 'center' });
    y += 5;
    doc.text('Tel: (032) 255-5555 | Email: info@cdu.edu.ph', 105, y, { align: 'center' });
    y += 5;
    doc.text('TIN: 123-456-789-000', 105, y, { align: 'center' });
    y += 15;
    // BIR Header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('OFFICIAL RECEIPT', 105, y, { align: 'center' });
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('BIR Permit No. 123456789012345', 105, y, { align: 'center' });
    y += 5;
    doc.text('BIR Accreditation No. FP012345678901234567890', 105, y, { align: 'center' });
    y += 10;

    // Hospital/Clinic Information
    

    // Receipt Details
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    const receiptDate = new Date(billing.transactionDate || new Date()).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    doc.text(`Receipt No: ${billing.id || 'N/A'}`, 15, y);
    doc.text(`Date: ${receiptDate}`, 150, y);
    y += 10;

    // Patient Information
    doc.text('Sold to:', 15, y);
    y += 8;
    doc.setFont(undefined, 'normal');
    doc.text(`Patient: ${billing.patientFullName || 'N/A'}`, 15, y);
    y += 6;

    if (billing.patientId) {
    const qrDataUrl = await QRCode.toDataURL(billing.patientId, { width: 50 });
    doc.addImage(qrDataUrl, 'PNG', 15, y, 20, 20); // 20x20 mm QR code
    y += 25; // move down after QR code
  } else {
    doc.text("Patient ID: N/A", 15, y);
    y += 6;
    doc.text(`Address: _________________________________`, 15, y);
    y += 6;
    doc.text(`TIN: _______________________`, 15, y);
    y += 15;
  }
    // Items Table Header
    doc.setFont(undefined, 'bold');
    doc.text('QTY', 15, y);
    doc.text('UNIT', 35, y);
    doc.text('DESCRIPTION', 55, y);
    doc.text('UNIT PRICE', 130, y);
    doc.text('AMOUNT', 170, y);
    y += 5;
    
    // Draw line under header
    doc.line(15, y, 195, y);
    y += 8;

    doc.setFont(undefined, 'normal');
    let subtotal = 0;

    // Medicines Section
    if (medicines.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.text('MEDICINES:', 15, y);
      y += 6;
      doc.setFont(undefined, 'normal');
      
      medicines.forEach(item => {
        const unitPrice = item.pricePerUnit || 0;
        const quantity = item.quantity || 1;
        const amount = item.totalPrice || (unitPrice * quantity);
        subtotal += amount;

        doc.text(quantity.toString(), 15, y);
        doc.text('pc', 35, y);
        doc.text(item.itemName || 'Medicine', 55, y);
        doc.text(`P${unitPrice.toFixed(2)}`, 130, y);
        doc.text(`P${amount.toFixed(2)}`, 170, y);
        y += 6;
      });
      y += 3;
    }

    // Supplies Section
    if (supplies.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.text('MEDICAL SUPPLIES:', 15, y);
      y += 6;
      doc.setFont(undefined, 'normal');
      
      supplies.forEach(item => {
        const unitPrice = item.pricePerUnit || 0;
        const quantity = item.quantity || 1;
        const amount = item.totalPrice || (unitPrice * quantity);
        subtotal += amount;

        doc.text(quantity.toString(), 15, y);
        doc.text('pc', 35, y);
        doc.text(item.itemName || 'Medical Supply', 55, y);
        doc.text(`P${unitPrice.toFixed(2)}`, 130, y);
        doc.text(`P${amount.toFixed(2)}`, 170, y);
        y += 6;
      });
      y += 3;
    }

    // Services/Laboratory Section
    if (services.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.text('MEDICAL SERVICES/LABORATORY:', 15, y);
      y += 6;
      doc.setFont(undefined, 'normal');
      
      services.forEach(item => {
        const unitPrice = item.pricePerUnit || 0;
        const quantity = item.quantity || 1;
        const amount = item.totalPrice || (unitPrice * quantity);
        subtotal += amount;

        doc.text(quantity.toString(), 15, y);
        doc.text('svc', 35, y);
        doc.text(item.itemName || 'Medical Service', 55, y);
        doc.text(`P${unitPrice.toFixed(2)}`, 130, y);
        doc.text(`P${amount.toFixed(2)}`, 170, y);
        y += 6;
      });
      y += 3;
    }

    // Consultations Section
    if (consultations.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.text('PROFESSIONAL FEES:', 15, y);
      y += 6;
      doc.setFont(undefined, 'normal');
      
      consultations.forEach(item => {
        const unitPrice = item.pricePerUnit || 0;
        const quantity = item.quantity || 1;
        const amount = item.totalPrice || (unitPrice * quantity);
        subtotal += amount;

        doc.text(quantity.toString(), 15, y);
        doc.text('svc', 35, y);
        doc.text(item.itemName || 'Consultation', 55, y);
        doc.text(`P${unitPrice.toFixed(2)}`, 130, y);
        doc.text(`P${amount.toFixed(2)}`, 170, y);
        y += 6;
      });
      y += 3;
    }

    // Totals Section
    y += 10;
    doc.line(130, y, 195, y);
    y += 8;

    const totalAmount = billing.amount || subtotal;
    const vatAmount = totalAmount * 0.12; // 12% VAT
    const vatableSales = totalAmount - vatAmount;

    doc.setFont(undefined, 'normal');
    doc.text('Vatable Sales:', 130, y);
    doc.text(`P${vatableSales.toFixed(2)}`, 170, y);
    y += 6;

    doc.text('VAT (12%):', 130, y);
    doc.text(`P${vatAmount.toFixed(2)}`, 170, y);
    y += 6;

    doc.line(130, y, 195, y);
    y += 8;

    doc.setFont(undefined, 'bold');
    doc.text('TOTAL AMOUNT DUE:', 130, y);
    doc.text(`P${totalAmount.toFixed(2)}`, 170, y);
    y += 15;

    // Payment Information
    doc.setFont(undefined, 'normal');
    doc.text(`Payment Status: ${billing.status?.toUpperCase() || 'UNPAID'}`, 15, y);
    y += 6;
    doc.text(`Payment Method: ${paymentMethod === 'gcash' ? 'GCash' : 'Cash / Check / Credit Card'}`, 15, y);
    y += 6;

    // Add cash payment details if cash method
    if (paymentMethod === 'cash' && cashReceived) {
      doc.text(`Cash Received: P${parseFloat(cashReceived).toFixed(2)}`, 15, y);
      y += 6;
      if (change > 0) {
        doc.text(`Change Given: P${change.toFixed(2)}`, 15, y);
        y += 6;
      }
    }

    y += 10;

    // BIR Footer
    doc.setFontSize(8);
    doc.text('THIS INVOICE/RECEIPT SHALL BE VALID FOR FIVE (5) YEARS FROM THE DATE OF', 105, y, { align: 'center' });
    y += 4;
    doc.text('THE PERMIT TO PRINT. THIS RECEIPT IS NOT VALID WITHOUT BIR PERMIT.', 105, y, { align: 'center' });
    y += 8;

    doc.text('Software Provider: Hospital Management System', 15, y);
    doc.text(`Date Printed: ${new Date().toLocaleDateString('en-PH')}`, 150, y);
    y += 4;
    doc.text('VAT Reg. TIN: 123-456-789-000', 15, y);
    doc.text('PTU No.: FP012345678901234567890', 120, y);

    // Save the PDF
    const fileName = `BIR_Receipt_${billing.patientFullName?.replace(/\s+/g, '_') || 'Patient'}_${Date.now()}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Billing Details</h2>
        
        {/* Patient Information */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
  <h3 className="text-lg font-semibold mb-2">Patient Information</h3>

  <div className="grid grid-cols-2 gap-4">
    <p><strong>Patient Name:</strong> {billing.patientFullName}</p>
    <p><strong>Status:</strong> {billing.status}</p>

    {/* Row with Total Amount, Date, and QR code on the right */}
    <div className="col-span-2 flex justify-between items-start">
      <div>
        <p><strong>Total Amount:</strong> ₱{billing.amount ? billing.amount.toFixed(2) : '0.00'}</p>
        <p><strong>Date:</strong> {new Date(billing.transactionDate || new Date()).toLocaleDateString('en-PH')}</p>
        <p><strong>Clinic:</strong> {billing.clinicName}</p>
      </div>

      <div>
        {patientQrCode ? (
          <img
            src={patientQrCode}
            alt="Patient QR Code"
            className="w-24 h-24 border rounded"
          />
        ) : (
          <p className="text-gray-500 text-sm">No Patient ID</p>
        )}
      </div>
    </div>
    </div>
</div>
            {/* <p><strong>Total Amount:</strong> ₱{billing.amount ? billing.amount.toFixed(2) : '0.00'}</p>
            <p><strong>Status:</strong> {billing.status}</p>
            <p><strong>Date:</strong> {new Date(billing.transactionDate || new Date()).toLocaleDateString('en-PH')}</p>
            <p><strong>Clinic:</strong> {billing.clinicName}</p>
          </div>
        </div> */}

        {/* Medicines Used */}
        {medicines.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-blue-600">💊 Medicines Used</h3>
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Medicine Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Quantity</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{item.itemName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">₱{item.pricePerUnit?.toFixed(2) || '0.00'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">₱{item.totalPrice?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Medical Supplies Used */}
        {supplies.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-green-600">🏥 Medical Supplies Used</h3>
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-green-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Supply Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Quantity</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {supplies.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{item.itemName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">₱{item.pricePerUnit?.toFixed(2) || '0.00'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">₱{item.totalPrice?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Laboratory/Medical Services */}
        {services.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-purple-600">🔬 Laboratory & Medical Services</h3>
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-purple-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Service Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Quantity</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Service Fee</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {services.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{item.itemName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">₱{item.pricePerUnit?.toFixed(2) || '0.00'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">₱{item.totalPrice?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Professional Fees/Consultations */}
        {consultations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-orange-600">👨‍⚕️ Professional Fees</h3>
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-orange-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Doctor/Service</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Sessions</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Fee</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{item.itemName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">₱{item.pricePerUnit?.toFixed(2) || '0.00'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">₱{item.totalPrice?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <div className="text-right">
            <div className="text-xl font-bold">
              Total Amount: ₱{billing.amount ? billing.amount.toFixed(2) : '0.00'}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              VAT Inclusive (12%): ₱{billing.amount ? (billing.amount * 0.12).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Payment Method</h3>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => handlePaymentMethodChange(e.target.value)}
                className="mr-2"
              />
              💵 Cash Payment
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="gcash"
                checked={paymentMethod === 'gcash'}
                onChange={(e) => handlePaymentMethodChange(e.target.value)}
                className="mr-2"
              />
              📱 GCash
            </label>
          </div>

          {/* Cash Payment Calculator */}
          {paymentMethod === 'cash' && (
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <h4 className="font-semibold mb-3">💰 Cash Payment Calculator</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left side - Input and suggestions */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cash Received (₱)
                  </label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="Enter cash amount"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                  
                  {/* Quick amount buttons */}
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Quick amounts:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {generateSuggestedAmounts().map((amount, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickAmount(amount)}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                        >
                          ₱{amount.toFixed(2)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side - Calculation display */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-bold">₱{(billing.amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Cash Received:</span>
                      <span className="font-bold text-green-600">
                        ₱{cashReceived ? parseFloat(cashReceived).toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <hr className="border-gray-300" />
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Change:</span>
                      <span className={`font-bold text-lg ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₱{change.toFixed(2)}
                      </span>
                    </div>
                    
                    {paymentError && (
                      <div className="text-red-600 text-sm font-medium mt-2">
                        ⚠️ {paymentError}
                      </div>
                    )}
                    
                    {change > 0 && cashReceived && (
                      <div className="text-green-600 text-sm mt-2">
                        ✅ Payment sufficient. Change: ₱{change.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button 
            onClick={handleGenerateBIRReceipt} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
            disabled={paymentMethod === 'cash' && parseFloat(cashReceived || 0) < (billing.amount || 0)}
          >
            📄 Generate BIR Receipt
          </button>
          {paymentMethod === 'gcash' && (
            <button
              onClick={handleSimulateGCashPayment}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
            >
              💳 Pay with GCash
            </button>
          )}
          <button 
            onClick={onClose} 
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


export default ViewBill;