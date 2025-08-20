import React, { useState, useEffect } from "react";
import {
  ref,
  onValue,
  remove,
  update,
  get,
  push,
} from "firebase/database";
import { database } from "../../firebase/firebase";
import ViewBill from "./ViewBill";
import DeleteConfirmationModal from "./DeleteConfirmationModalBilling";
import AddBill from "./AddBill";
import DateRangePicker from "../../components/DateRangePicker/DateRangePicker";
import ReceiptModal from "./ReceiptModal";
import ServicePaymentModal from "./ServicePaymentModal";
import PatientBillGenerationModal from "./PatientBillGenerationModal";
import QRCode from "qrcode";
import { Search, Plus, Eye, CreditCard, Trash2, Receipt, Users, Activity, Shield, TestTube } from "lucide-react";

const Billing = () => {
  // Main billing states
  const [billings, setBillings] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewBilling, setViewBilling] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [billingToDelete, setBillingToDelete] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Patient billing generation states
  const [isPatientBillModalOpen, setIsPatientBillModalOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [patientQRCodes, setPatientQRCodes] = useState({});

  // Service payment states
  const [isServicePaymentModalOpen, setIsServicePaymentModalOpen] = useState(false);

  // Cache for already billed items
  const [billedItemsCache, setBilledItemsCache] = useState({});

  // Clinic info
  const CLINIC_ID = "clin_cebu_doctors_id";
  const CLINIC_NAME = "Cebu Doctors' University Hospital";

  // Fetch and cache all billed items from paid bills
  useEffect(() => {
    const fetchBilledItems = async () => {
      try {
        const billingsRef = ref(database, "clinicBilling");
        const snapshot = await get(billingsRef);
        
        if (snapshot.exists()) {
          const allBillings = snapshot.val();
          const billedItemsMap = {};

          Object.values(allBillings).forEach(billing => {
            if (billing.status === 'paid' && billing.billedItems && billing.patientId) {
              billing.billedItems.forEach(item => {
                const itemKey = `${billing.patientId}_${item.itemType}_${item.itemId}_${item.timestamp}`;
                billedItemsMap[itemKey] = {
                  ...item,
                  patientId: billing.patientId,
                  billedInTransaction: billing.id || 'unknown',
                  paidDate: billing.paidDate
                };
              });
            }
          });

          setBilledItemsCache(billedItemsMap);
          console.log(`📋 Loaded ${Object.keys(billedItemsMap).length} billed items from existing bills`);
        }
      } catch (error) {
        console.error('Error fetching billed items:', error);
      }
    };

    fetchBilledItems();
  }, []);

  // Listen for billing updates
  useEffect(() => {
    const billingsRef = ref(database, "clinicBilling");
    const unsubscribe = onValue(billingsRef, (snapshot) => {
      const billingList = [];
      const updatedBilledItemsMap = {};

      if (snapshot.exists()) {
        const billingsData = snapshot.val();
        
        Object.keys(billingsData).forEach((billId) => {
          const billing = billingsData[billId];
          
          if (billing.clinicId === CLINIC_ID && billing.status === "unpaid") {
            billingList.push({ id: billId, ...billing });
          }
          
          if (billing.status === 'paid' && billing.billedItems && billing.patientId) {
            billing.billedItems.forEach(item => {
              const itemKey = `${billing.patientId}_${item.itemType}_${item.itemId}_${item.timestamp}`;
              updatedBilledItemsMap[itemKey] = {
                ...item,
                patientId: billing.patientId,
                billedInTransaction: billId,
                paidDate: billing.paidDate
              };
            });
          }
        });
        
        setBillings(billingList);
        setBilledItemsCache(updatedBilledItemsMap);
      } else {
        setBillings([]);
        setBilledItemsCache({});
      }
    });

    return () => unsubscribe();
  }, []);

  // Generate QR codes for patients
  useEffect(() => {
    if (patients.length > 0) {
      const generateQRCodes = async () => {
        const qrMap = {};
        for (const patient of patients) {
          try {
            const qrDataUrl = await QRCode.toDataURL(patient.id, { width: 60 });
            qrMap[patient.id] = qrDataUrl;
          } catch (err) {
            console.error(`Error generating QR for ${patient.id}`, err);
          }
        }
        setPatientQRCodes(qrMap);
      };

      generateQRCodes();
    }
  }, [patients]);

  // Fetch all patients
  useEffect(() => {
    const patientsRef = ref(database, "patients");
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

  // Filter billings
  const filteredBillings = billings.filter((billing) => {
    const billingDate = new Date(billing.transactionDate);
    const withinDateRange =
      (!startDate || billingDate >= startDate) &&
      (!endDate || billingDate <= endDate);
    const matchesSearchTerm = billing.patientFullName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    return withinDateRange && matchesSearchTerm;
  });

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
        alert("Error deleting billing: " + error.message);
      }
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (billing) => {
    setBillingToDelete(billing);
    setIsDeleteModalOpen(true);
  };

  // Mark as paid
  const handleMarkAsPaid = async (billing) => {
    try {
      const billingRef = ref(database, `clinicBilling/${billing.id}`);
      await update(billingRef, {
        status: "paid",
        paidDate: new Date().toISOString(),
      });

      setBillings(billings.filter((b) => b.id !== billing.id));
      alert("✅ Bill marked as paid! Items are now automatically excluded from future bills.");
      
    } catch (error) {
      console.error("❌ Error updating billing status:", error);
      alert("Error updating billing status: " + error.message);
    }
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

  const handleCloseAddBillModal = () => {
    setIsAddModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header Section */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Billing Management</h1>
                <p className="text-slate-600 mt-1">Manage patient bills and payments</p>
              </div>
            </div>
            
            {/* Anti-Double-Billing Status */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 min-w-64">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-900">Anti-Double-Billing Active</div>
                    <div className="text-xs text-emerald-700">{Object.keys(billedItemsCache).length} items tracked</div>
                  </div>
                </div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Controls Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left side - Search and Date Range */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by patient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              {/* Date Range */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="min-w-fit">
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                  />
                </div>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsServicePaymentModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <TestTube className="h-5 w-5" />
                <span>Pay for Service</span>
              </button>
              <button
                onClick={() => setIsPatientBillModalOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Generate Patient Bill</span>
              </button>
            </div>
          </div>
        </div>

        {/* Billing Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Patient</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBillings.length > 0 ? (
                  filteredBillings.map((billing, index) => (
                    <tr key={billing.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{billing.patientFullName}</div>
                            <div className="text-sm text-slate-500">ID: {billing.patientId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-bold text-slate-900">
                          ₱{new Intl.NumberFormat("en-PH", {
                            minimumFractionDigits: 2,
                          }).format(billing.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            billing.status === "paid"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {billing.status === "paid" ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(billing.transactionDate).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleViewBilling(billing)}
                            className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors duration-150"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleMarkAsPaid(billing)}
                            className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors duration-150"
                            title="Mark as Paid"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(billing)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-150"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setViewBilling(billing);
                              setIsReceiptModalOpen(true);
                            }}
                            className="p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors duration-150"
                            title="Print Receipt"
                          >
                            <Receipt className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                          <Activity className="h-8 w-8 text-slate-400" />
                        </div>
                        <div className="text-lg font-semibold text-slate-600">No billings found</div>
                        <div className="text-sm text-slate-500">Try adjusting your search criteria</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isServicePaymentModalOpen && (
        <ServicePaymentModal
          isOpen={isServicePaymentModalOpen}
          onClose={() => setIsServicePaymentModalOpen(false)}
          patients={patients}
          clinicId={CLINIC_ID}
          clinicName={CLINIC_NAME}
        />
      )}

      {isPatientBillModalOpen && (
        <PatientBillGenerationModal
          isOpen={isPatientBillModalOpen}
          onClose={() => setIsPatientBillModalOpen(false)}
          patients={patients}
          patientQRCodes={patientQRCodes}
          billedItemsCache={billedItemsCache}
          clinicId={CLINIC_ID}
          clinicName={CLINIC_NAME}
        />
      )}

      {isViewModalOpen && viewBilling && (
        <ViewBill billing={viewBilling} onClose={handleCloseModal} />
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
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