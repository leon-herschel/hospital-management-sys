import React, { useState, useEffect } from "react";
import { ref, onValue, push } from "firebase/database";
import { database } from "../../firebase/firebase";
import { getAuth } from "firebase/auth";
import QRCode from "qrcode";
import { Search, Users, TestTube, CreditCard, X, CheckCircle, Download } from "lucide-react";

const ServicePaymentModal = ({ isOpen, onClose, patients }) => {
  const [medicalServices, setMedicalServices] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [patientNotes, setPatientNotes] = useState("");
  const [urgentFlag, setUrgentFlag] = useState(false);
  
  // New state for dynamic clinic data
  const [clinicId, setClinicId] = useState(null);
  const [clinicName, setClinicName] = useState("");
  const [isLoadingClinicData, setIsLoadingClinicData] = useState(true);

  // Fetch user's clinic data on component mount
  useEffect(() => {
    if (isOpen) {
      const fetchUserClinicData = async () => {
        try {
          const auth = getAuth();
          const currentUser = auth.currentUser;
          
          if (!currentUser) {
            console.error("No authenticated user found");
            setIsLoadingClinicData(false);
            return;
          }

          const userId = currentUser.uid;
          
          // Fetch user data to get clinicAffiliation
          const userRef = ref(database, `users/${userId}`);
          onValue(userRef, (userSnapshot) => {
            if (userSnapshot.exists()) {
              const userData = userSnapshot.val();
              const userClinicId = userData.clinicAffiliation;
              
              if (userClinicId) {
                setClinicId(userClinicId);
                
                // Fetch clinic data using the clinicId
                const clinicRef = ref(database, `clinics/${userClinicId}`);
                onValue(clinicRef, (clinicSnapshot) => {
                  if (clinicSnapshot.exists()) {
                    const clinicData = clinicSnapshot.val();
                    setClinicName(clinicData.name || "Unknown Clinic");
                  } else {
                    console.error("Clinic data not found");
                    setClinicName("Unknown Clinic");
                  }
                  setIsLoadingClinicData(false);
                }, (error) => {
                  console.error("Error fetching clinic data:", error);
                  setClinicName("Unknown Clinic");
                  setIsLoadingClinicData(false);
                });
              } else {
                console.error("User has no clinic affiliation");
                setIsLoadingClinicData(false);
              }
            } else {
              console.error("User data not found");
              setIsLoadingClinicData(false);
            }
          }, (error) => {
            console.error("Error fetching user data:", error);
            setIsLoadingClinicData(false);
          });
        } catch (error) {
          console.error("Error in fetchUserClinicData:", error);
          setIsLoadingClinicData(false);
        }
      };

      fetchUserClinicData();
    }
  }, [isOpen]);

  // Fetch medical services on component mount
  useEffect(() => {
    if (isOpen) {
      const servicesRef = ref(database, "medicalServices");
      const unsubscribe = onValue(servicesRef, (snapshot) => {
        if (snapshot.exists()) {
          setMedicalServices(snapshot.val());
        } else {
          setMedicalServices({});
        }
      });

      return () => unsubscribe();
    }
  }, [isOpen]);

  // Get all services flattened from categories
  const getAllServices = () => {
    const allServices = [];
    Object.entries(medicalServices).forEach(([category, services]) => {
      Object.entries(services).forEach(([serviceId, serviceData]) => {
        allServices.push({
          id: serviceId,
          category: category,
          ...serviceData
        });
      });
    });
    return allServices;
  };

  // Filter services based on search query
  const filteredServices = getAllServices().filter(service =>
    service.name?.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(serviceSearchQuery.toLowerCase())
  );

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    return fullName.includes(patientSearchQuery.toLowerCase());
  });

  // Toggle service selection
  const toggleServiceSelection = (service) => {
    setSelectedServices(prev => {
      const isSelected = prev.find(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  // Calculate total amount
  const totalAmount = selectedServices.reduce((total, service) => {
    return total + parseFloat(service.serviceFee || 0);
  }, 0);

  // Process service payment
  const handleServicePayment = async () => {
    if (!selectedPatient || selectedServices.length === 0) {
      alert("Please select a patient and at least one service.");
      return;
    }

    if (!clinicId || !clinicName) {
      alert("Clinic information is not available. Please try again.");
      return;
    }

    setIsProcessingPayment(true);
    try {
      const patientFullName = `${selectedPatient.firstName} ${selectedPatient.lastName}`;
      const currentTime = new Date().toISOString();

      // Prepare billing data for service payment
      const serviceBillData = {
        patientId: selectedPatient.id,
        patientFullName: patientFullName,
        clinicId: clinicId,
        clinicName: clinicName,
        amount: totalAmount,
        status: "paid", // Service payments are paid immediately
        transactionDate: currentTime,
        paidDate: currentTime,
        paymentType: "service_prepayment",
        billedItems: selectedServices.map(service => ({
          itemId: service.id,
          itemName: service.name,
          itemType: "prepaid_service",
          pricePerUnit: parseFloat(service.serviceFee),
          quantity: 1,
          totalPrice: parseFloat(service.serviceFee),
          timestamp: currentTime,
          serviceCategory: service.category,
          description: service.description
        })),
        createdAt: currentTime,
        processedBy: {
          userId: getAuth().currentUser?.uid || "system",
          firstName: "System",
          lastName: "Generated",
        },
      };

      // Save the service payment bill
      const billingsRef = ref(database, "clinicBilling");
      const newBillRef = await push(billingsRef, serviceBillData);
      const billId = newBillRef.key;

      // Create individual transaction for each service
      const transactionPromises = selectedServices.map(async (service) => {
        const medicalServicesTransactionData = {
          patientName: patientFullName,
          patientNotes: patientNotes || "",
          resultStatus: "pending", // Will be confirmed by lab tech
          sampleStatus: "pending", // Same as resultStatus
          serviceCategory: service.name,
          serviceId: service.id,
          status: "pending", // Will be confirmed by lab tech
          transactionType: "SERVICE_PREPAYMENT",
          updatedAt: currentTime,
          urgentFlag: urgentFlag,
          // Additional fields for reference
          patientId: selectedPatient.id,
          clinicId: clinicId,
          clinicName: clinicName,
          billId: billId,
        //   serviceFee: parseFloat(service.serviceFee),
          serviceDescription: service.description,
          serviceCategory: service.category,
          createdAt: currentTime
        };

        // Save each service transaction under the clinic
        const medicalServicesTransactionRef = ref(database, `medicalServicesTransactions`);
        return await push(medicalServicesTransactionRef, medicalServicesTransactionData);
      });

      // Wait for all transactions to be saved
      const transactionResults = await Promise.all(transactionPromises);
      const transactionIds = transactionResults.map(result => result.key);

      // Generate QR code for the receipt
      const receiptData = {
        billId: billId,
        transactionIds: transactionIds,
        patientId: selectedPatient.id,
        patientName: patientFullName,
        services: selectedServices.map(service => service.name),
        totalAmount: totalAmount,
        paidDate: currentTime,
        clinicName: clinicName,
        receiptType: "SERVICE_PREPAYMENT",
        urgentFlag: urgentFlag,
        patientNotes: patientNotes
      };

      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(receiptData), {
        width: 200,
        margin: 2
      });

      // Set receipt data for display
      setPaymentReceipt({
        ...receiptData,
        qrCode: qrCodeDataUrl,
        serviceDetails: selectedServices,
        receiptNumber: billId.slice(-8).toUpperCase()
      });

      setShowReceipt(true);

    } catch (error) {
      console.error("Error processing service payment:", error);
      alert("Error processing payment: " + error.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Reset modal state
  const resetModal = () => {
    setSelectedPatient(null);
    setSelectedServices([]);
    setServiceSearchQuery("");
    setPatientSearchQuery("");
    setPaymentReceipt(null);
    setShowReceipt(false);
    setIsProcessingPayment(false);
    setPatientNotes("");
    setUrgentFlag(false);
  };

  // Handle close
  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Download receipt as PDF
  const downloadReceiptAsPDF = async () => {
    if (!paymentReceipt) return;

    try {
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      
      // Format the date
      const formattedDate = new Date(paymentReceipt.paidDate).toLocaleDateString();
      const formattedTime = new Date(paymentReceipt.paidDate).toLocaleTimeString();

      // Generate the HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Service Payment Receipt</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .clinic-name {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 5px;
            }
            .receipt-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .receipt-number {
              font-size: 12px;
              color: #666;
            }
            .info-section {
              margin-bottom: 25px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 8px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: bold;
              color: #555;
            }
            .services-section {
              margin-bottom: 25px;
            }
            .services-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 15px;
              padding-bottom: 5px;
              border-bottom: 1px solid #ddd;
            }
            .service-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .service-item:last-child {
              border-bottom: none;
            }
            .total-section {
              background-color: #f0f9ff;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #2563eb;
              margin-bottom: 25px;
            }
            .total-amount {
              font-size: 20px;
              font-weight: bold;
              color: #059669;
              text-align: right;
            }
            .qr-section {
              text-align: center;
              margin-bottom: 25px;
              padding: 20px;
              border: 2px dashed #ddd;
              border-radius: 8px;
            }
            .qr-code {
              margin: 15px 0;
            }
            .instructions {
              background-color: #fef3c7;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #f59e0b;
              margin-bottom: 25px;
            }
            .urgent-flag {
              background-color: #fef2f2;
              padding: 10px 15px;
              border-radius: 8px;
              border-left: 4px solid #dc2626;
              margin-bottom: 15px;
              color: #dc2626;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">${clinicName}</div>
            <div class="receipt-title">SERVICE PAYMENT RECEIPT</div>
            <div class="receipt-number">Receipt #: ${paymentReceipt.receiptNumber}</div>
          </div>

          ${paymentReceipt.urgentFlag ? '<div class="urgent-flag">⚠️ URGENT - PRIORITY PROCESSING</div>' : ''}

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Patient:</span>
              <span>${paymentReceipt.patientName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Patient ID:</span>
              <span>${paymentReceipt.patientId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span>${formattedDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time:</span>
              <span>${formattedTime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span style="color: #059669; font-weight: bold;">PAID</span>
            </div>
            ${paymentReceipt.patientNotes ? `
            <div class="info-row">
              <span class="info-label">Notes:</span>
              <span>${paymentReceipt.patientNotes}</span>
            </div>
            ` : ''}
          </div>

          <div class="services-section">
            <div class="services-title">Services Paid:</div>
            ${paymentReceipt.serviceDetails.map(service => `
              <div class="service-item">
                <span>${service.name}</span>
                <span style="font-weight: bold;">₱${parseFloat(service.serviceFee).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>

          <div class="total-section">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 18px; font-weight: bold;">Total Amount:</span>
              <span class="total-amount">₱${paymentReceipt.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div class="qr-section">
            <div style="font-weight: bold; margin-bottom: 10px;">Payment Verification QR Code</div>
            <div class="qr-code">
              <img src="${paymentReceipt.qrCode}" alt="Payment QR Code" style="width: 150px; height: 150px;" />
            </div>
            <div style="font-size: 12px; color: #666;">
              Present this QR code at the laboratory/service area
            </div>
          </div>

          <div class="instructions">
            <div style="font-weight: bold; margin-bottom: 8px;">Important Instructions:</div>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Present this receipt at the laboratory/service area before receiving services</li>
              <li>Keep this receipt for your records</li>
              <li>Services are pre-paid and non-refundable</li>
              <li>QR code contains payment verification data</li>
            </ul>
          </div>

          <div class="footer">
            <div>Thank you for choosing ${clinicName}</div>
            <div>Generated on: ${new Date().toLocaleString()}</div>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="
              background-color: #2563eb;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              margin-right: 10px;
            ">Print Receipt</button>
            <button onclick="window.close()" style="
              background-color: #6b7280;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
            ">Close</button>
          </div>
        </body>
        </html>
      `;

      // Write the HTML content to the new window
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Focus on the new window
      printWindow.focus();

      // Optional: Auto-trigger print dialog after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 500);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF receipt: " + error.message);
    }
  };

  if (!isOpen) return null;

  // Show loading state while fetching clinic data
  if (isLoadingClinicData) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <div className="text-lg font-semibold text-slate-900">Loading clinic information...</div>
          <div className="text-sm text-slate-600">Please wait while we fetch your clinic details</div>
        </div>
      </div>
    );
  }

  // Show error state if clinic data couldn't be loaded
  if (!clinicId || !clinicName) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Unable to Load Clinic Information</h3>
            <p className="text-slate-600 mb-6">
              We couldn't retrieve your clinic information. Please make sure you have a valid clinic affiliation.
            </p>
            <button
              onClick={handleClose}
              className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg">
                <TestTube className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Pay for Medical Service</h2>
                <p className="text-slate-600">
                  Select patient and services to pay for - {clinicName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-150"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {showReceipt ? (
            // Receipt Display
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-b from-white to-slate-50 border border-slate-200 rounded-2xl p-8 shadow-lg">
                {/* Success Icon */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h3>
                  <p className="text-slate-600">Your service payment has been processed</p>
                </div>

                {/* Urgent Flag Display */}
                {paymentReceipt.urgentFlag && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-bold text-red-700">⚠️ URGENT - PRIORITY PROCESSING</span>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                )}

                {/* Receipt Details */}
                <div className="space-y-4 mb-6">
                  <div className="text-center">
                    <h4 className="font-bold text-lg text-slate-900">{clinicName}</h4>
                    <p className="text-sm text-slate-600">Service Payment Receipt</p>
                    <p className="text-xs text-slate-500">Receipt #: {paymentReceipt.receiptNumber}</p>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Patient:</span>
                      <span className="font-semibold text-slate-900">{paymentReceipt.patientName}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Date:</span>
                      <span className="text-slate-900">{new Date(paymentReceipt.paidDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-4">
                      <span className="text-slate-600">Time:</span>
                      <span className="text-slate-900">{new Date(paymentReceipt.paidDate).toLocaleTimeString()}</span>
                    </div>
                    {paymentReceipt.patientNotes && (
                      <div className="mb-4">
                        <div className="text-sm text-slate-600 mb-1">Notes:</div>
                        <div className="text-sm text-slate-900 p-2 bg-slate-50 rounded-lg">{paymentReceipt.patientNotes}</div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <h5 className="font-semibold text-slate-900 mb-3">Services Paid:</h5>
                    <div className="space-y-2">
                      {paymentReceipt.serviceDetails.map((service, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-slate-700">{service.name}</span>
                          <span className="font-semibold text-slate-900">₱{parseFloat(service.serviceFee).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-slate-900">Total Paid:</span>
                      <span className="text-emerald-600">₱{paymentReceipt.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="text-center mb-6">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block">
                    <img src={paymentReceipt.qrCode} alt="Payment QR Code" className="w-32 h-32 mx-auto" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Show this QR code at the laboratory/service area</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={downloadReceiptAsPDF}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Payment Form
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Patient Selection */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Patient</h3>
                  
                  {/* Patient Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search patient by name..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  {/* Selected Patient Display */}
                  {selectedPatient && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {selectedPatient.firstName} {selectedPatient.lastName}
                            </div>
                            <div className="text-sm text-slate-600">ID: {selectedPatient.id}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedPatient(null)}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Patient List */}
                  {!selectedPatient && (
                    <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => setSelectedPatient(patient)}
                          className="text-left p-4 border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">
                                {patient.firstName} {patient.lastName}
                              </div>
                              {patient.dateOfBirth && (
                                <div className="text-sm text-slate-600">
                                  DOB: {patient.dateOfBirth}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Notes Section */}
                {selectedPatient && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Additional Information</h3>
                    
                    {/* Patient Notes */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Patient Notes (Optional)
                      </label>
                      <textarea
                        value={patientNotes}
                        onChange={(e) => setPatientNotes(e.target.value)}
                        placeholder="Enter any special instructions or notes for the lab technician..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                        rows="3"
                      />
                    </div>

                    {/* Urgent Flag Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <div className="font-medium text-slate-900">Mark as Urgent</div>
                        <div className="text-sm text-slate-600">Priority processing for this service</div>
                      </div>
                      <button
                        onClick={() => setUrgentFlag(!urgentFlag)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          urgentFlag ? 'bg-red-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            urgentFlag ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {urgentFlag && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-red-700">This service is marked as URGENT</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Service Selection */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Services</h3>
                  
                  {/* Service Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={serviceSearchQuery}
                      onChange={(e) => setServiceSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  {/* Selected Services Summary */}
                  {selectedServices.length > 0 && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-900">Selected Services ({selectedServices.length})</h4>
                        <div className="text-lg font-bold text-emerald-600">₱{totalAmount.toFixed(2)}</div>
                      </div>
                      <div className="space-y-2">
                        {selectedServices.map((service, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-slate-700">{service.name}</span>
                            <span className="font-semibold text-slate-900">₱{parseFloat(service.serviceFee).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available Services List */}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {filteredServices.map((service) => {
                      const isSelected = selectedServices.find(s => s.id === service.id);
                      return (
                        <div
                          key={service.id}
                          className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'border-purple-300 bg-purple-50'
                              : 'border-slate-200 hover:border-purple-200 hover:bg-purple-25'
                          }`}
                          onClick={() => toggleServiceSelection(service)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-purple-500 to-violet-500'
                                    : 'bg-slate-100'
                                }`}>
                                  <TestTube className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900">{service.name}</div>
                                  <div className="text-sm text-slate-600">{service.description}</div>
                                  <div className="text-xs text-slate-500 capitalize">Category: {service.category}</div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-slate-900">₱{parseFloat(service.serviceFee).toFixed(2)}</div>
                              {isSelected && (
                                <div className="text-xs text-purple-600 font-medium">Selected ✓</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredServices.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TestTube className="h-8 w-8 text-slate-400" />
                      </div>
                      <div className="text-slate-600">No services found</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showReceipt && (
          <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 rounded-b-2xl">
            <div className="flex justify-between items-center">
              <div className="text-slate-600">
                {selectedPatient && selectedServices.length > 0 && (
                  <div className="flex flex-col space-y-1">
                    <span>
                      Patient: <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong> | 
                      Services: <strong>{selectedServices.length}</strong> | 
                      Total: <strong className="text-emerald-600">₱{totalAmount.toFixed(2)}</strong>
                    </span>
                    {urgentFlag && (
                      <span className="text-red-600 text-sm font-medium">
                        ⚠️ Marked as URGENT
                      </span>
                    )}
                    {patientNotes && (
                      <span className="text-slate-500 text-sm">
                        Notes: {patientNotes.substring(0, 50)}{patientNotes.length > 50 ? '...' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleServicePayment}
                  disabled={!selectedPatient || selectedServices.length === 0 || isProcessingPayment}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-slate-300 disabled:to-slate-400 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 disabled:cursor-not-allowed"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      <span>Process Payment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicePaymentModal;