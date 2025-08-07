import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, update, query, orderByChild, equalTo, get, push, set } from 'firebase/database';
import { database } from '../../firebase/firebase';
import ViewBill from './ViewBill';
import DeleteConfirmationModal from './DeleteConfirmationModalBilling';
import AddBill from './AddBill';
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker';
import ReceiptModal from './ReceiptModal';

const Billing = () => {
  const [billings, setBillings] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewBilling, setViewBilling] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [billingToDelete, setBillingToDelete] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  
  // New states for patient billing generation
  const [isPatientBillModalOpen, setIsPatientBillModalOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientItems, setPatientItems] = useState([]);
  const [patientServices, setPatientServices] = useState([]);
  const [doctorFees, setDoctorFees] = useState([]);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [billPreview, setBillPreview] = useState(null);

  // Clinic info - you should replace these with actual clinic data
  const CLINIC_ID = "clin_cebu_doctors_id";
  const CLINIC_NAME = "Cebu Doctors' University Hospital";

  // Fetch billings from Firebase and listen for updates
  useEffect(() => {
    const billingsRef = ref(database, 'clinicBilling');

    const unsubscribe = onValue(billingsRef, (snapshot) => {
      const billingList = [];
      if (snapshot.exists()) {
        const billingsData = snapshot.val();
        Object.keys(billingsData).forEach((billId) => {
          const billing = billingsData[billId];
          // Filter by clinic and unpaid status
          if (billing.clinicId === CLINIC_ID && billing.status === 'unpaid') {
            billingList.push({ id: billId, ...billing });
          }
        });
        setBillings(billingList);
      } else {
        setBillings([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch all patients on component mount
  useEffect(() => {
    const patientsRef = ref(database, 'patients');
    const unsubscribe = onValue(patientsRef, (snapshot) => {
      const patientList = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          patientList.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setPatients(patientList);
      }
    });

    return () => unsubscribe();
  }, []);

  // Filter billings based on search term and date range
  const filteredBillings = billings.filter((billing) => {
    const billingDate = new Date(billing.transactionDate);
    const withinDateRange =
      (!startDate || billingDate >= startDate) &&
      (!endDate || billingDate <= endDate);
    const matchesSearchTerm = billing.patientFullName?.toLowerCase().includes(searchTerm.toLowerCase());
    return withinDateRange && matchesSearchTerm;
  });

  // Fetch patient's used items and services
  const fetchPatientBillingData = async (patientId) => {
    setIsGeneratingBill(true);
    try {
      const items = [];
      const services = [];
      const doctors = [];

      // Fetch inventory transactions for the patient
      const inventoryRef = ref(database, 'inventoryTransactions');
      const inventorySnapshot = await get(inventoryRef);
      
      if (inventorySnapshot.exists()) {
        inventorySnapshot.forEach((childSnapshot) => {
          const transaction = childSnapshot.val();
          if (transaction.relatedPatientId === patientId && transaction.transactionType === 'usage') {
            items.push({
              id: transaction.itemId,
              name: transaction.itemName,
              quantity: Math.abs(transaction.quantityChanged),
              timestamp: transaction.timestamp,
              department: transaction.sourceDepartment,
              type: 'inventory'
            });
          }
        });
      }

      // Fetch medical services transactions for the patient
      const servicesRef = ref(database, 'medicalServicesTransactions');
      const servicesSnapshot = await get(servicesRef);
      
      if (servicesSnapshot.exists()) {
        servicesSnapshot.forEach((childSnapshot) => {
          const service = childSnapshot.val();
          if (service.patientId === patientId) {
            services.push({
              id: service.serviceId,
              name: service.serviceName || 'Medical Service',
              category: service.serviceCategory,
              timestamp: service.createdAt,
              department: service.department,
              type: 'service'
            });
          }
        });
      }

      // Fetch doctor fees from appointments
      const appointmentsRef = ref(database, 'appointments');
      const appointmentsSnapshot = await get(appointmentsRef);
      
      if (appointmentsSnapshot.exists()) {
        appointmentsSnapshot.forEach((childSnapshot) => {
          const appointment = childSnapshot.val();
          if (appointment.patientId === patientId && appointment.status === 'completed') {
            doctors.push({
              doctorId: appointment.doctorId,
              doctorName: `${appointment.doctorFirstName} ${appointment.doctorLastName}`,
              appointmentType: appointment.type,
              timestamp: appointment.lastUpdated,
              type: 'consultation'
            });
          }
        });
      }

      setPatientItems(items);
      setPatientServices(services);
      setDoctorFees(doctors);
      
      // Generate bill preview
      await generateBillPreview(patientId, items, services, doctors);
      
    } catch (error) {
      console.error('Error fetching patient billing data:', error);
      alert('Error fetching patient data: ' + error.message);
    } finally {
      setIsGeneratingBill(false);
    }
  };

  // Generate bill preview with calculated amounts
  const generateBillPreview = async (patientId, items, services, doctors) => {
    try {
      let totalAmount = 0;
      const billedItems = [];

      // Calculate inventory items costs
      const inventoryItemsRef = ref(database, 'inventoryItems');
      const inventoryItemsSnapshot = await get(inventoryItemsRef);
      const inventoryItemsData = inventoryItemsSnapshot.val() || {};

      for (const item of items) {
        const itemData = inventoryItemsData[item.id];
        const pricePerUnit = itemData?.defaultRetailPrice || 0;
        const totalPrice = pricePerUnit * item.quantity;
        totalAmount += totalPrice;

        billedItems.push({
          itemId: item.id,
          itemName: item.name,
          itemType: 'medicine',
          pricePerUnit,
          quantity: item.quantity,
          totalPrice,
          timestamp: item.timestamp
        });
      }

      // Calculate medical services costs
      const medicalServicesRef = ref(database, 'medicalServices');
      const medicalServicesSnapshot = await get(medicalServicesRef);
      const medicalServicesData = medicalServicesSnapshot.val() || {};

      for (const service of services) {
        let serviceFee = 0;
        
        // Find service fee based on category
        if (service.category && medicalServicesData[service.category]) {
          const serviceData = medicalServicesData[service.category][service.id];
          serviceFee = parseFloat(serviceData?.serviceFee || 0);
        }

        totalAmount += serviceFee;

        billedItems.push({
          itemId: service.id,
          itemName: service.name,
          itemType: 'service',
          pricePerUnit: serviceFee,
          quantity: 1,
          totalPrice: serviceFee,
          timestamp: service.timestamp
        });
      }

      // Calculate doctor consultation fees
      const doctorsRef = ref(database, 'doctors');
      const doctorsSnapshot = await get(doctorsRef);
      const doctorsData = doctorsSnapshot.val() || {};

      for (const doctor of doctors) {
        const doctorData = doctorsData[doctor.doctorId];
        const consultationFee = doctorData?.professionalFees?.consultationFee || 
                               doctorData?.professionalFee || 500; // Default fee

        totalAmount += consultationFee;

        billedItems.push({
          itemId: doctor.doctorId,
          itemName: `${doctor.doctorName} - Consultation`,
          itemType: 'consultation',
          pricePerUnit: consultationFee,
          quantity: 1,
          totalPrice: consultationFee,
          timestamp: doctor.timestamp
        });
      }

      setBillPreview({
        patientId,
        billedItems,
        totalAmount,
        itemsCount: items.length,
        servicesCount: services.length,
        consultationsCount: doctors.length
      });

    } catch (error) {
      console.error('Error generating bill preview:', error);
      alert('Error calculating bill: ' + error.message);
    }
  };

  // Save the generated bill to Firebase - FIXED VERSION
  const saveBillToFirebase = async () => {
    if (!billPreview || !selectedPatient) return;

    try {
      const patientFullName = `${selectedPatient.firstName} ${selectedPatient.lastName}`;
      
      const billData = {
        patientId: selectedPatient.id,
        patientFullName: patientFullName,
        clinicId: CLINIC_ID,
        clinicName: CLINIC_NAME,
        amount: billPreview.totalAmount,
        status: 'unpaid',
        transactionDate: new Date().toISOString(),
        billedItems: billPreview.billedItems,
        createdAt: new Date().toISOString(),
        processedBy: {
          userId: 'current_user_id', // Replace with actual user ID
          firstName: 'System',
          lastName: 'Generated'
        }
      };

      // Use push() to generate a unique key automatically
      const billingsRef = ref(database, 'clinicBilling');
      await push(billingsRef, billData);

      alert('Bill generated successfully!');
      setIsPatientBillModalOpen(false);
      setBillPreview(null);
      setSelectedPatient(null);
      setPatientItems([]);
      setPatientServices([]);
      setDoctorFees([]);

    } catch (error) {
      console.error('Error saving bill:', error);
      alert('Error saving bill: ' + error.message);
    }
  };

  // Handle deleting a billing
  const handleDeleteBilling = async () => {
    if (billingToDelete) {
      try {
        const billingRef = ref(database, `clinicBilling/${billingToDelete.id}`);
        await remove(billingRef);
        setBillings(billings.filter((b) => b.id !== billingToDelete.id));
        setIsDeleteModalOpen(false);
        setBillingToDelete(null);
      } catch (error) {
        alert('Error deleting billing: ' + error.message);
      }
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (billing) => {
    setBillingToDelete(billing);
    setIsDeleteModalOpen(true);
  };

  // Handle marking a billing as paid
  const handleMarkAsPaid = async (billing) => {
    try {
      const billingRef = ref(database, `clinicBilling/${billing.id}`);
      await update(billingRef, { 
        status: 'paid',
        paidDate: new Date().toISOString()
      });
      setBillings(billings.filter((b) => b.id !== billing.id));
    } catch (error) {
      alert('Error updating billing status: ' + error.message);
    }
  };

  const handleCloseAddBillModal = () => {
    setIsAddModalOpen(false);
  };

  // Fetch patient details for viewing
  const handleViewBilling = async (billing) => {
    setViewBilling(billing);
    setIsViewModalOpen(true);

    if (billing.patientId) {
      const patientRef = ref(database, `patients/${billing.patientId}`);
      const snapshot = await get(patientRef);
      if (snapshot.exists()) {
        setPatientDetails(snapshot.val());
      } else {
        setPatientDetails(null);
      }
    } else {
      setPatientDetails(null);
    }
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setViewBilling(null);
  };

  return (
    <div className="w-full">
      <div className="flex justify-center">
        <h1 className="text-3xl font-bold mb-4">Billing List</h1>
      </div>

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by patient name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 rounded-lg w-full max-w-xs"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setIsPatientBillModalOpen(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
            Generate Patient Bill
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="flex justify-between items-center mb-4">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <table className="min-w-full border-collapse border border-gray-300 bg-white">
        <thead>
          <tr className="bg-gray-200">
            <th className="border-b px-4 py-2 text-left">Patient Name</th>
            <th className="border-b px-4 py-2 text-left">Amount</th>
            <th className="border-b px-4 py-2 text-left">Status</th>
            <th className="border-b px-4 py-2 text-left">Transaction Date</th>
            <th className="border-b px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBillings.length > 0 ? (
            filteredBillings.map(billing => (
              <tr key={billing.id} className="hover:bg-gray-100">
                <td className="border-b px-4 py-2">
                  {billing.patientFullName}
                </td>
                <td className="border-b px-4 py-2">
                  ₱ {new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(billing.amount)}
                </td>
                <td className="border-b px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    billing.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {billing.status}
                  </span>
                </td>
                <td className="border-b px-4 py-2">
                  {new Date(billing.transactionDate).toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="border-b px-4 py-2">
                  <button 
                    onClick={() => handleViewBilling(billing)} 
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-md mr-2"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleMarkAsPaid(billing)} 
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-md mr-2"
                  >
                    Mark as Paid
                  </button>
                  <button 
                    onClick={() => openDeleteModal(billing)} 
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md mr-2"
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => {
                      setViewBilling(billing);
                      setIsReceiptModalOpen(true);
                    }} 
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-1 rounded-md"
                  >
                    Receipt
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="border-b px-4 py-2 text-center">No billings found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Patient Bill Generation Modal */}
      {isPatientBillModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Generate Patient Bill</h2>
            
            {!selectedPatient ? (
              <div>
                <h3 className="text-lg font-semibold mb-3">Select Patient:</h3>
                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                  {patients.map(patient => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        fetchPatientBillingData(patient.id);
                      }}
                      className="text-left p-3 border rounded-lg hover:bg-gray-100"
                    >
                      <div className="font-semibold">{patient.firstName} {patient.lastName}</div>
                      <div className="text-sm text-gray-600">ID: {patient.id}</div>
                      {patient.dateOfBirth && (
                        <div className="text-sm text-gray-600">DOB: {patient.dateOfBirth}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">
                    Patient: {selectedPatient.firstName} {selectedPatient.lastName}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedPatient(null);
                      setBillPreview(null);
                      setPatientItems([]);
                      setPatientServices([]);
                      setDoctorFees([]);
                    }}
                    className="text-blue-500 underline text-sm"
                  >
                    Choose different patient
                  </button>
                </div>

                {isGeneratingBill ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4">Calculating bill...</p>
                  </div>
                ) : billPreview ? (
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Bill Preview</h4>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{billPreview.itemsCount}</div>
                          <div className="text-sm text-gray-600">Items Used</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{billPreview.servicesCount}</div>
                          <div className="text-sm text-gray-600">Services</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">{billPreview.consultationsCount}</div>
                          <div className="text-sm text-gray-600">Consultations</div>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto mb-4">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border px-3 py-2 text-left">Item/Service</th>
                            <th className="border px-3 py-2 text-left">Type</th>
                            <th className="border px-3 py-2 text-right">Qty</th>
                            <th className="border px-3 py-2 text-right">Unit Price</th>
                            <th className="border px-3 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billPreview.billedItems.map((item, index) => (
                            <tr key={index}>
                              <td className="border px-3 py-2">{item.itemName}</td>
                              <td className="border px-3 py-2 capitalize">{item.itemType}</td>
                              <td className="border px-3 py-2 text-right">{item.quantity}</td>
                              <td className="border px-3 py-2 text-right">₱{item.pricePerUnit.toFixed(2)}</td>
                              <td className="border px-3 py-2 text-right">₱{item.totalPrice.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="border-t pt-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          Total Amount: ₱{billPreview.totalAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={saveBillToFirebase}
                        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                      >
                        Generate Bill
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p>No billable items found for this patient.</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setIsPatientBillModalOpen(false);
                  setSelectedPatient(null);
                  setBillPreview(null);
                  setPatientItems([]);
                  setPatientServices([]);
                  setDoctorFees([]);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Modals */}
      {isViewModalOpen && viewBilling && (
        <ViewBill billing={viewBilling} onClose={handleCloseModal} />
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <AddBill onClose={handleCloseAddBillModal} />
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onConfirm={handleDeleteBilling}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}

      {isReceiptModalOpen && (
        <ReceiptModal
          billing={viewBilling}
          patientDetails={patientDetails}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Billing;