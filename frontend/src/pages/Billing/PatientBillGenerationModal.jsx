import React, { useState } from "react";
import { ref, get, push } from "firebase/database";
import { database } from "../../firebase/firebase";
import { Search, Users, Shield, X } from "lucide-react";

const PatientBillGenerationModal = ({ 
  isOpen, 
  onClose, 
  onBillGenerated, // New prop for success callback
  patients, 
  patientQRCodes, 
  billedItemsCache, 
  clinicId, 
  clinicName 
}) => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientItems, setPatientItems] = useState([]);
  const [patientServices, setPatientServices] = useState([]);
  const [doctorFees, setDoctorFees] = useState([]);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [billPreview, setBillPreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Helper function to safely convert to number and format
  const safeToFixed = (value, decimals = 2) => {
    const numValue = Number(value);
    return isNaN(numValue) ? "0.00" : numValue.toFixed(decimals);
  };

  // Helper function to get safe numeric value
  const getSafeNumber = (value) => {
    const numValue = Number(value);
    return isNaN(numValue) ? 0 : numValue;
  };

  // Helper function to clean object properties (remove undefined values)
  const cleanObject = (obj) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  // Check if item has already been billed using cache
  const isItemAlreadyBilled = (itemId, itemType, patientId, timestamp) => {
    const itemKey = `${patientId}_${itemType}_${itemId}_${timestamp}`;
    const isBilled = billedItemsCache.hasOwnProperty(itemKey);
    
    if (isBilled) {
      const billedItem = billedItemsCache[itemKey];
      console.log(`⏭️ Skipping already billed ${itemType}: ${billedItem.itemName} (Paid: ${billedItem.paidDate})`);
    }
    
    return isBilled;
  };

  // Enhanced fetch patient billing data to exclude already billed items and SERVICE_PREPAYMENT
  const fetchPatientBillingData = async (patientId) => {
    setIsGeneratingBill(true);
    try {
      const items = [];
      const services = [];
      const doctors = [];
      let skippedCount = 0;
      let skippedPrepaymentCount = 0;



      // Fetch inventory transactions for the patient
      const inventoryRef = ref(database, "inventoryTransactions");
      const inventorySnapshot = await get(inventoryRef);

      if (inventorySnapshot.exists()) {
        for (const [transactionId, transaction] of Object.entries(inventorySnapshot.val())) {
          if (
            transaction.relatedPatientId === patientId &&
            transaction.transactionType === "usage"
          ) {
            if (!isItemAlreadyBilled(transaction.itemId, "medicine", patientId, transaction.timestamp)) {
              items.push({
                id: transaction.itemId,
                name: transaction.itemName,
                quantity: Math.abs(transaction.quantityChanged),
                timestamp: transaction.timestamp,
                department: transaction.sourceDepartment,
                type: "inventory",
              });
            } else {
              skippedCount++;
            }
          }
        }
      }

      // Fetch medical services transactions for the patient (EXCLUDE SERVICE_PREPAYMENT)
      const servicesRef = ref(database, "medicalServicesTransactions");
      const servicesSnapshot = await get(servicesRef);

      if (servicesSnapshot.exists()) {
        for (const [serviceTransactionId, service] of Object.entries(servicesSnapshot.val())) {
          if (service.patientId === patientId) {
            // NEW: Skip SERVICE_PREPAYMENT transactions as they are already paid
            if (service.transactionType === "SERVICE_PREPAYMENT") {
              skippedPrepaymentCount++;
              console.log(`💳 Skipping prepaid service: ${service.serviceName} (Already paid via prepayment)`);
              continue;
            }

            if (service.serviceCategory === "consultationTypes") {
              // FIXED: Use "consultation" as itemType for consistency
              if (!isItemAlreadyBilled(service.serviceId, "consultation", patientId, service.createdAt)) {
                const consultationFee = getSafeNumber(service.professionalFee);

                let displayName = service.serviceName;
                if (service.serviceName === "follow_up") {
                  displayName = "Follow-up Consultation";
                } else if (service.serviceName === "General Consultation") {
                  displayName = "General Consultation";
                }

                services.push({
                  id: service.serviceId,
                  name: displayName,
                  category: service.serviceCategory,
                  timestamp: service.createdAt,
                  department: service.department,
                  price: consultationFee,
                  type: "consultation", // This matches the itemType used in checking
                  unitPrice: consultationFee,
                  consultationType: service.consultationType || service.serviceName,
                  requestedByName: service.requestedByName,
                });
              } else {
                skippedCount++;
                console.log(`⏭️ Skipping already billed consultation: ${service.serviceName}`);
              }
            } else {
              // FIXED: Use "service" as itemType for non-consultation medical services
              if (!isItemAlreadyBilled(service.serviceId, "service", patientId, service.createdAt)) {
                const serviceDetailsRef = ref(
                  database,
                  `medicalServices/${service.serviceCategory}/${service.serviceId}`
                );
                const serviceDetailsSnapshot = await get(serviceDetailsRef);

                let serviceDetails = {};
                if (serviceDetailsSnapshot.exists()) {
                  serviceDetails = serviceDetailsSnapshot.val();
                }

                const servicePrice = getSafeNumber(serviceDetails.price || serviceDetails.serviceFee);

                services.push({
                  id: service.serviceId,
                  name: serviceDetails.name || service.serviceName || "Medical Service",
                  category: service.serviceCategory,
                  timestamp: service.createdAt,
                  department: service.department,
                  price: servicePrice,
                  type: "service", // This matches the itemType used in checking
                  unitPrice: servicePrice,
                });
              } else {
                skippedCount++;
                console.log(`⏭️ Skipping already billed service: ${service.serviceName}`);
              }
            }
          }
        }
      }

      console.log(`✅ Found ${items.length} unbilled items, ${services.length} unbilled services`);
      console.log(`⏭️ Skipped ${skippedCount} already billed items`);
      console.log(`💳 Skipped ${skippedPrepaymentCount} prepaid services`);

      setPatientItems(items);
      setPatientServices(services);
      setDoctorFees([]); // no more fetching from appointments

      // Generate bill preview
      await generateBillPreview(patientId, items, services, []);
    } catch (error) {
      console.error("Error fetching patient billing data:", error);
      alert("Error fetching patient data: " + error.message);
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
      const inventoryItemsRef = ref(database, "inventoryItems");
      const inventoryItemsSnapshot = await get(inventoryItemsRef);
      const inventoryItemsData = inventoryItemsSnapshot.val() || {};

      for (const item of items) {
        const itemData = inventoryItemsData[item.id];
        const pricePerUnit = getSafeNumber(itemData?.defaultRetailPrice);
        const quantity = getSafeNumber(item.quantity);
        const totalPrice = pricePerUnit * quantity;
        totalAmount += totalPrice;

        // Clean the item object to remove undefined values
        const billedItem = cleanObject({
          itemId: item.id,
          itemName: item.name,
          itemType: "medicine",
          pricePerUnit,
          quantity,
          totalPrice,
          timestamp: item.timestamp,
        });

        billedItems.push(billedItem);
      }

      // Calculate medical services costs (including consultations from medicalServicesTransactions)
      for (const service of services) {
        const serviceFee = getSafeNumber(service.price);
        totalAmount += serviceFee;

        // Clean the service object to remove undefined values
        const billedItem = cleanObject({
          itemId: service.id,
          itemName: service.name,
          itemType: service.type, // This will be "consultation" or "service"
          pricePerUnit: serviceFee,
          quantity: 1,
          totalPrice: serviceFee,
          timestamp: service.timestamp,
          consultationType: service.consultationType,
          requestedBy: service.requestedByName,
        });

        billedItems.push(billedItem);
      }

      // Calculate doctor consultation fees (for legacy appointments without service transactions)
      const doctorsRef = ref(database, "doctors");
      const doctorsSnapshot = await get(doctorsRef);
      const doctorsData = doctorsSnapshot.val() || {};

      for (const doctor of doctors) {
        const doctorData = doctorsData[doctor.doctorId];
        const consultationFee = getSafeNumber(
          doctorData?.professionalFees?.consultationFee ||
          doctorData?.professionalFee ||
          500 // Default fee
        );

        totalAmount += consultationFee;

        // Clean the doctor item object to remove undefined values
        const billedItem = cleanObject({
          itemId: doctor.doctorId,
          itemName: `${doctor.doctorName} - Consultation`,
          itemType: "consultation",
          unitPrice: consultationFee,
          pricePerUnit: consultationFee,
          quantity: 1,
          totalPrice: consultationFee,
          timestamp: doctor.timestamp,
        });

        billedItems.push(billedItem);
      }

      setBillPreview({
        patientId,
        billedItems,
        totalAmount,
        itemsCount: items.length,
        servicesCount: services.filter(s => s.type !== "consultation").length,
        consultationsCount: services.filter(s => s.type === "consultation").length + doctors.length,
      });
    } catch (error) {
      console.error("Error generating bill preview:", error);
      alert("Error calculating bill: " + error.message);
    }
  };

  // Save the generated bill to Firebase
  const saveBillToFirebase = async () => {
    if (!billPreview || !selectedPatient) return;

    try {
      const patientFullName = `${selectedPatient.firstName} ${selectedPatient.lastName}`;

      // Clean all billed items to ensure no undefined values
      const cleanedBilledItems = billPreview.billedItems.map(item => cleanObject(item));

      const billData = cleanObject({
        patientId: selectedPatient.id,
        patientFullName: patientFullName,
        clinicId: clinicId,
        clinicName: clinicName,
        amount: billPreview.totalAmount,
        status: "unpaid",
        transactionDate: new Date().toISOString(),
        billedItems: cleanedBilledItems,
        createdAt: new Date().toISOString(),
        processedBy: {
          userId: "current_user_id",
          firstName: "System",
          lastName: "Generated",
        },
      });

      const billingsRef = ref(database, "clinicBilling");
      await push(billingsRef, billData);

      // Call the success callback instead of showing alert
      if (onBillGenerated) {
        onBillGenerated(patientFullName, billPreview.totalAmount);
      }

      handleClose();
    } catch (error) {
      console.error("Error saving bill:", error);
      alert("Error saving bill: " + error.message);
    }
  };

  // Reset modal state
  const resetModal = () => {
    setSelectedPatient(null);
    setPatientItems([]);
    setPatientServices([]);
    setDoctorFees([]);
    setBillPreview(null);
    setSearchQuery("");
    setIsGeneratingBill(false);
  };

  // Handle close
  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Generate Patient Bill</h2>
            <button
              onClick={handleClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-150"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {!selectedPatient ? (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-slate-900">Select Patient:</h3>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {patients
                  .filter((patient) => {
                    const fullName =
                      `${patient.firstName} ${patient.lastName}`.toLowerCase();
                    return fullName.includes(searchQuery.toLowerCase());
                  })
                  .map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        fetchPatientBillingData(patient.id);
                      }}
                      className="text-left p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">
                            {patient.firstName} {patient.lastName}
                          </div>
                          {patient.dateOfBirth && (
                            <div className="text-sm text-slate-600">
                              DOB: {patient.dateOfBirth}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {patientQRCodes[patient.id] ? (
                            <img
                              src={patientQRCodes[patient.id]}
                              alt="Patient QR Code"
                              className="w-12 h-12 rounded-lg border border-slate-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </h3>
                      <p className="text-sm text-slate-600">Patient ID: {selectedPatient.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPatient(null);
                      setBillPreview(null);
                      setPatientItems([]);
                      setPatientServices([]);
                      setDoctorFees([]);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Choose different patient
                  </button>
                </div>
              </div>

              {isGeneratingBill ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Checking for unbilled items...</h3>
                  <p className="text-sm text-slate-600">
                    Excluding {Object.keys(billedItemsCache).length} already billed items and prepaid services
                  </p>
                </div>
              ) : billPreview ? (
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-6">Bill Preview</h4>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          {billPreview.itemsCount}
                        </div>
                        <div className="text-sm font-medium text-blue-800">
                          Unbilled Items
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600 mb-1">
                          {billPreview.servicesCount}
                        </div>
                        <div className="text-sm font-medium text-emerald-800">
                          Unbilled Services
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-1">
                          {billPreview.consultationsCount}
                        </div>
                        <div className="text-sm font-medium text-purple-800">
                          Unbilled Consultations
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                              Item/Service
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Type</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Details</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">Qty</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                              Unit Price
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {billPreview.billedItems.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-900">
                                {item.itemName}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                  item.itemType === 'medicine' ? 'bg-blue-100 text-blue-800' :
                                  item.itemType === 'service' ? 'bg-green-100 text-green-800' :
                                  item.itemType === 'consultation' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.itemType}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {item.itemType === 'consultation' && item.consultationType && (
                                  <div>
                                    <div className="font-medium">{item.consultationType}</div>
                                    {item.requestedBy && (
                                      <div className="text-xs text-slate-500">by {item.requestedBy}</div>
                                    )}
                                  </div>
                                )}
                                {item.itemType === 'medicine' && (
                                  <div className="text-xs text-slate-500">
                                    Medicine/Supply
                                  </div>
                                )}
                                {item.itemType === 'service' && (
                                  <div className="text-xs text-slate-500">
                                    Medical Service
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                {getSafeNumber(item.quantity)}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-slate-900">
                                ₱{safeToFixed(item.unitPrice || item.pricePerUnit)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-900">
                                ₱{safeToFixed(item.totalPrice)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Total Section */}
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm text-emerald-700 font-medium">
                          Excludes billed items and prepaid services - no double billing
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-slate-900">
                          Total: ₱{safeToFixed(billPreview.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={saveBillToFirebase}
                      className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Generate Bill
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="text-4xl">✅</div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No unbilled items found</h3>
                  <p className="text-slate-600">
                    All items for this patient have been billed or are prepaid services.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 rounded-b-2xl">
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientBillGenerationModal;