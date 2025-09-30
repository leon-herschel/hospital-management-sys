import React, { useState, useMemo, useCallback } from "react";
import {
  Search,
  FileText,
  Calendar,
  User,
  Pill,
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
  Stethoscope,
  AlertTriangle,
  Eye,
  EyeOff,
  Shield
} from "lucide-react";

function PatientMedicalConditionsTab({
  patientMedicalHistory,
  patientId, // Use patientId instead of selectedPatientId to match your existing pattern
  // Keep existing props for backward compatibility
  filteredMedicalConditions = [],
  medicalConditionsSearchQuery = "",
  setMedicalConditionsSearchQuery,
  formatMedicalConditions
}) {
  const [searchQuery, setSearchQuery] = useState(medicalConditionsSearchQuery);
  const [sortBy, setSortBy] = useState("consultationDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [expandedEntries, setExpandedEntries] = useState(new Set());
  const [filterBy, setFilterBy] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [viewHiddenPermissions, setViewHiddenPermissions] = useState(new Set());

  // Get patient's medical history entries from the new data structure
  const patientEntries = useMemo(() => {
    if (!patientId || !patientMedicalHistory?.[patientId]?.entries) {
      return [];
    }

    const entries = patientMedicalHistory[patientId].entries;
    return Object.entries(entries).map(([id, entry]) => ({
      id,
      ...entry,
      formattedDate: new Date(entry.consultationDate).toLocaleDateString(),
      formattedTime: entry.consultationTime || new Date(entry.consultationDate).toLocaleTimeString()
    }));
  }, [patientMedicalHistory, patientId]);

  // Determine which data to display
  const displayData = patientEntries.length > 0 ? patientEntries : filteredMedicalConditions;
  const isUsingNewFormat = patientEntries.length > 0;
  
  // Use appropriate search query and setter based on data format
  const currentSearchQuery = isUsingNewFormat ? searchQuery : medicalConditionsSearchQuery;
  const setCurrentSearchQuery = isUsingNewFormat ? setSearchQuery : setMedicalConditionsSearchQuery;

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    let filtered = displayData;

    // Apply search filter
    if (currentSearchQuery?.trim()) {
      const query = currentSearchQuery.toLowerCase();
      filtered = filtered.filter(entry => {
        if (isUsingNewFormat) {
          // For new medical history format
          return (
            entry.clinicalSummary?.toLowerCase().includes(query) ||
            entry.diagnosis?.some(d => d.description?.toLowerCase().includes(query)) ||
            entry.medications?.toLowerCase().includes(query) ||
            entry.treatmentPlan?.toLowerCase().includes(query) ||
            entry.provider?.firstName?.toLowerCase().includes(query) ||
            entry.provider?.lastName?.toLowerCase().includes(query) ||
            entry.type?.toLowerCase().includes(query)
          );
        } else {
          // For legacy medical conditions format
          return (
            entry.condition?.toLowerCase().includes(query) ||
            entry.description?.toLowerCase().includes(query)
          );
        }
      });
    }

    // Apply type filter for new format only
    if (filterBy !== "all" && isUsingNewFormat) {
      filtered = filtered.filter(entry => 
        entry.type?.toLowerCase().includes(filterBy.toLowerCase())
      );
    }

    // Sort entries for new format
    if (isUsingNewFormat) {
      filtered.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        if (sortBy === "consultationDate") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue?.toLowerCase() || '';
        }

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return filtered;
  }, [displayData, currentSearchQuery, sortBy, sortOrder, filterBy, isUsingNewFormat]);

  // Pagination
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return filteredEntries.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredEntries, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);

  // Get unique consultation types for filter (new format only)
  const consultationTypes = useMemo(() => {
    if (!isUsingNewFormat) return [];
    const types = new Set(patientEntries.map(entry => entry.type).filter(Boolean));
    return Array.from(types);
  }, [patientEntries, isUsingNewFormat]);

  const toggleExpanded = useCallback((entryId) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  }, []);

  const requestViewPermission = useCallback((entryId) => {
    setViewHiddenPermissions(prev => {
      const newSet = new Set(prev);
      newSet.add(entryId);
      return newSet;
    });
  }, []);

  const formatDiagnoses = (diagnoses) => {
    if (!diagnoses || !Array.isArray(diagnoses)) return "No diagnoses recorded";
    return diagnoses.map(d => d.description || d.code).filter(Boolean).join(", ") || "No diagnoses recorded";
  };

  const formatPrescriptions = (prescriptions) => {
    if (!prescriptions || !Array.isArray(prescriptions)) return [];
    return prescriptions.filter(p => p.medication);
  };

  // Component to render blurred text with permission request
  const BlurredContent = ({ children, entryId, label = "sensitive information" }) => {
    const hasPermission = viewHiddenPermissions.has(entryId);
    
    if (hasPermission) {
      return <>{children}</>;
    }
    
    return (
      <div className="relative">
        <div className="filter blur-sm select-none pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center p-4">
            <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-3">
              This {label} is protected and requires patient permission to view.
            </p>
            <button
              onClick={() => requestViewPermission(entryId)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Request Permission to View</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Component to render data with conditional blurring
  const ProtectedData = ({ entry, children }) => {
    if (!entry.isHidden) {
      return <>{children}</>;
    }
    
    return (
      <BlurredContent entryId={entry.id} label="medical record">
        {children}
      </BlurredContent>
    );
  };

  // Render legacy medical conditions format
  if (!isUsingNewFormat) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <h2 className="text-xl font-bold text-gray-900">Medical History</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search conditions..."
              value={currentSearchQuery}
              onChange={(e) => setCurrentSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No medical conditions found</h3>
            <p className="text-gray-500">
              {displayData.length === 0
                ? "No medical conditions recorded for this patient."
                : "Try adjusting your search."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredEntries.map((condition, index) => (
              <div key={condition.id || index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{condition.condition}</h3>
                        <p className="text-sm text-gray-500">Recorded: {condition.dateRecorded}</p>
                      </div>
                    </div>
                    {condition.description && (
                      <div className="mt-3 ml-13">
                        <p className="text-gray-600">{condition.description}</p>
                      </div>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render new comprehensive medical history format
  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <h2 className="text-xl font-bold text-gray-900">Medical History</h2>
          <div className="text-sm text-gray-500">
            {filteredEntries.length} of {patientEntries.length} entries
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search medical records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex space-x-2">
            {consultationTypes.length > 0 && (
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <option value="all">All Types</option>
                {consultationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            )}

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
            >
              <option value="consultationDate-desc">Newest First</option>
              <option value="consultationDate-asc">Oldest First</option>
              <option value="type-asc">Type A-Z</option>
              <option value="type-desc">Type Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medical History Entries */}
      <div className="space-y-4">
        {paginatedEntries.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Medical History</h3>
            <p className="text-gray-500">No medical history records found for this patient.</p>
          </div>
        ) : (
          paginatedEntries.map((entry) => {
            const isExpanded = expandedEntries.has(entry.id);
            const prescriptions = formatPrescriptions(entry.prescriptions);
            const isHidden = entry.isHidden;
            
            return (
              <div key={entry.id} className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow ${isHidden ? 'border-amber-200 bg-amber-50/20' : 'border-gray-200'}`}>
                {/* Hidden Entry Warning Banner */}
                {isHidden && !viewHiddenPermissions.has(entry.id) && (
                  <div className="bg-amber-100 border-b border-amber-200 px-6 py-3 rounded-t-lg">
                    <div className="flex items-center space-x-2 text-amber-800">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">Protected Medical Record</span>
                      <span className="text-sm">- Patient permission required to view details</span>
                    </div>
                  </div>
                )}

                {/* Entry Header */}
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => toggleExpanded(entry.id)}
                >
                  <ProtectedData entry={entry}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isHidden ? 'bg-amber-100' : 'bg-blue-100'}`}>
                            {isHidden ? (
                              <Shield className={`w-5 h-5 ${isHidden ? 'text-amber-600' : 'text-blue-600'}`} />
                            ) : (
                              <Stethoscope className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {entry.type || "General Consultation"}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{entry.formattedDate}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{entry.formattedTime}</span>
                              </div>
                              {entry.provider && (
                                <div className="flex items-center space-x-1">
                                  <User className="w-4 h-4" />
                                  <span>Dr. {entry.provider.firstName} {entry.provider.lastName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Summary */}
                        <div className="mt-3 ml-13">
                          <p className="text-gray-600 line-clamp-2">
                            {entry.clinicalSummary || "No clinical summary available"}
                          </p>
                          <div className="mt-2 flex items-center space-x-4 text-sm">
                            <span className="text-gray-500">
                              <strong>Diagnosis:</strong> {formatDiagnoses(entry.diagnosis)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isHidden && (
                          <div className="flex items-center space-x-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-200">
                            <EyeOff className="w-3 h-3" />
                            <span>Protected</span>
                          </div>
                        )}
                        {prescriptions.length > 0 && (
                          <div className="flex items-center space-x-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                            <Pill className="w-3 h-3" />
                            <span>{prescriptions.length} Rx</span>
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </ProtectedData>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-6 space-y-6">
                    <ProtectedData entry={entry}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Clinical Information */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>Clinical Information</span>
                          </h4>
                          
                          {entry.presentIllnessHistory && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Present Illness History</label>
                              <p className="mt-1 text-gray-600">{entry.presentIllnessHistory}</p>
                            </div>
                          )}

                          {entry.reviewOfSymptoms && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Review of Symptoms</label>
                              <p className="mt-1 text-gray-600">{entry.reviewOfSymptoms}</p>
                            </div>
                          )}

                          {entry.allergies && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Allergies</label>
                              <p className="mt-1 text-gray-600">{entry.allergies}</p>
                            </div>
                          )}

                          {entry.vitals && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Vitals</label>
                              <p className="mt-1 text-gray-600">{entry.vitals}</p>
                            </div>
                          )}
                        </div>

                        {/* Treatment Information */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                            <Activity className="w-4 h-4" />
                            <span>Treatment Information</span>
                          </h4>

                          {entry.treatmentPlan && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Treatment Plan</label>
                              <p className="mt-1 text-gray-600">{entry.treatmentPlan}</p>
                            </div>
                          )}

                          {entry.medications && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Medications</label>
                              <p className="mt-1 text-gray-600">{entry.medications}</p>
                            </div>
                          )}

                          {entry.labResults && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Lab Results</label>
                              <p className="mt-1 text-gray-600">{entry.labResults}</p>
                            </div>
                          )}

                          {entry.differentialDiagnosis && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Differential Diagnosis</label>
                              <p className="mt-1 text-gray-600">{entry.differentialDiagnosis}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SOAP Notes */}
                      {entry.soapNotes && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">SOAP Notes</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {entry.soapNotes.subjective && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Subjective</label>
                                <p className="mt-1 text-gray-600">{entry.soapNotes.subjective}</p>
                              </div>
                            )}
                            {entry.soapNotes.objective && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Objective</label>
                                <p className="mt-1 text-gray-600">{entry.soapNotes.objective}</p>
                              </div>
                            )}
                            {entry.soapNotes.assessment && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Assessment</label>
                                <p className="mt-1 text-gray-600">{entry.soapNotes.assessment}</p>
                              </div>
                            )}
                            {entry.soapNotes.plan && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Plan</label>
                                <p className="mt-1 text-gray-600">{entry.soapNotes.plan}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Prescriptions */}
                      {prescriptions.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 flex items-center space-x-2 mb-3">
                            <Pill className="w-4 h-4" />
                            <span>Prescriptions</span>
                          </h4>
                          <div className="space-y-3">
                            {prescriptions.map((prescription, index) => (
                              <div key={prescription.id || index} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <span className="font-medium text-gray-900">{prescription.medication}</span>
                                  <span className="text-gray-500">•</span>
                                  <span className="text-gray-600">{prescription.dosage}</span>
                                  <span className="text-gray-500">•</span>
                                  <span className="text-gray-600">{prescription.frequency}</span>
                                  <span className="text-gray-500">•</span>
                                  <span className="text-gray-600">{prescription.duration}</span>
                                  {prescription.prescribedDate && (
                                    <>
                                      <span className="text-gray-500">•</span>
                                      <span className="text-gray-500">Prescribed: {prescription.prescribedDate}</span>
                                    </>
                                  )}
                                </div>
                                {prescription.description && (
                                  <p className="mt-1 text-sm text-gray-600">{prescription.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </ProtectedData>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination - Only show for new format with multiple entries */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Show</span>
              <select
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-700">entries</span>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{Math.min((currentPage - 1) * entriesPerPage + 1, filteredEntries.length)}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * entriesPerPage, filteredEntries.length)}</span> of{' '}
                <span className="font-medium">{filteredEntries.length}</span> results
              </p>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + Math.max(1, currentPage - 2);
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`relative inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium ${
                      pageNum === currentPage
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientMedicalConditionsTab;