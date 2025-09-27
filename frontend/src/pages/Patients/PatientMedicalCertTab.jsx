import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { 
  FileText, 
  Calendar, 
  User, 
  MapPin, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  EyeOff,
  Search,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const PatientMedicalCertTab = ({ patientId }) => {
  const [medicalCertificates, setMedicalCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCert, setSelectedCert] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!patientId) return;

    const certRef = ref(database, `patientMedicalCertificates/${patientId}`);
    const unsubscribe = onValue(certRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const certArray = Object.entries(data).map(([id, cert]) => ({
          id,
          ...cert
        }));
        // Sort by most recent first
        certArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setMedicalCertificates(certArray);
      } else {
        setMedicalCertificates([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [patientId]);

  const filteredCertificates = medicalCertificates.filter(cert => {
    const matchesSearch = 
      cert.medicalDetails?.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.doctor?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificateId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || cert.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const displayedCertificates = isExpanded 
    ? filteredCertificates 
    : filteredCertificates.slice(0, 5);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800 border-green-200',
      expired: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    
    return statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleViewCertificate = (cert) => {
    setSelectedCert(cert);
    setShowCertModal(true);
  };

  const handleDownloadCertificate = (cert) => {
    // Create a simple text-based certificate for download
    const certContent = `
MEDICAL CERTIFICATE
${cert.clinic?.name || 'N/A'}
${cert.clinic?.address || 'N/A'}
${cert.clinic?.contact || 'N/A'}

Certificate ID: ${cert.certificateId || 'N/A'}
Issue Date: ${formatDate(cert.issuedDate)}
Issue Location: ${cert.issueLocation || 'N/A'}

Patient Information:
Name: ${cert.patient?.name || 'N/A'}
Age: ${cert.patient?.age || 'N/A'}
Gender: ${cert.patient?.gender || 'N/A'}
Address: ${cert.patient?.address || 'N/A'}
Contact: ${cert.patient?.contactNumber || 'N/A'}

Medical Details:
Diagnosis: ${cert.medicalDetails?.diagnosis || 'N/A'}
Date From: ${formatDate(cert.medicalDetails?.dateFrom)}
Date To: ${formatDate(cert.medicalDetails?.dateTo)}
Rest Days: ${cert.medicalDetails?.restDays || 'N/A'}
Restrictions: ${cert.medicalDetails?.restrictions || 'N/A'}
Recommendations: ${cert.medicalDetails?.recommendations || 'N/A'}
Follow-up Date: ${formatDate(cert.medicalDetails?.followUpDate)}
Remarks: ${cert.medicalDetails?.remarks || 'N/A'}

Attending Physician:
Dr. ${cert.doctor?.fullName || 'N/A'}
PRC ID: ${cert.doctor?.prcId || 'N/A'}
Specialty: ${cert.doctor?.specialty || 'N/A'}
Contact: ${cert.doctor?.contactNumber || 'N/A'}

Status: ${cert.status || 'N/A'}
Signed: ${cert.isSigned ? 'Yes' : 'No'}
Signed Date: ${cert.isSigned ? formatDateTime(cert.signedDate) : 'N/A'}
`;

    const blob = new Blob([certContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-certificate-${cert.certificateId || 'unknown'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <h2 className="text-xl font-bold text-gray-900">Medical Certificates</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search certificates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      )}

      {filteredCertificates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No medical certificates found</h3>
          <p className="text-gray-500">
            {medicalCertificates.length === 0
              ? "No medical certificates recorded for this patient."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedCertificates.map((cert) => (
            <div key={cert.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Medical Certificate
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(cert.status)}`}>
                        {cert.status ? cert.status.charAt(0).toUpperCase() + cert.status.slice(1) : 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(cert.issuedDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{formatDateTime(cert.issuedDate).split(',')[1]?.trim() || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>Dr. {cert.doctor?.fullName || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="text-sm">
                      <div className="mb-2">
                        <span className="font-medium text-gray-900">Certificate ID:</span>
                        <span className="ml-2 text-gray-600">{cert.certificateId || 'N/A'}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-medium text-gray-900">Diagnosis:</span>
                        <span className="ml-2 text-gray-600">{cert.medicalDetails?.diagnosis || 'N/A'}</span>
                      </div>
                      {cert.medicalDetails && (
                        <div className="text-gray-600">
                          <span className="font-medium text-gray-900">Rest Period:</span>
                          <span className="ml-2">
                            {formatDate(cert.medicalDetails.dateFrom)} - {formatDate(cert.medicalDetails.dateTo)} 
                            ({cert.medicalDetails.restDays || 0} days)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleViewCertificate(cert)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Certificate"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadCertificate(cert)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Download Certificate"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredCertificates.length > 5 && (
        <div className="text-center mt-6">
          <button
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>
              {isExpanded ? "Show Less" : `Show All (${filteredCertificates.length} certificates)`}
            </span>
          </button>
        </div>
      )}

      {/* Certificate Detail Modal */}
      {showCertModal && selectedCert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Medical Certificate Details</h2>
                <button
                  onClick={() => setShowCertModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Clinic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Clinic Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedCert.clinic?.name || 'N/A'}</p>
                  <p><span className="font-medium">Address:</span> {selectedCert.clinic?.address || 'N/A'}</p>
                  <p><span className="font-medium">Contact:</span> {selectedCert.clinic?.contact || 'N/A'}</p>
                </div>
              </div>

              {/* Certificate Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Certificate Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Certificate ID:</span> {selectedCert.certificateId || 'N/A'}</p>
                    <p><span className="font-medium">Issue Date:</span> {formatDateTime(selectedCert.issuedDate)}</p>
                    <p><span className="font-medium">Issue Location:</span> {selectedCert.issueLocation || 'N/A'}</p>
                    <p><span className="font-medium">Status:</span> {getStatusBadge(selectedCert.status)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Patient Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedCert.patient?.name || 'N/A'}</p>
                    <p><span className="font-medium">Age:</span> {selectedCert.patient?.age || 'N/A'}</p>
                    <p><span className="font-medium">Gender:</span> {selectedCert.patient?.gender || 'N/A'}</p>
                    <p><span className="font-medium">Contact:</span> {selectedCert.patient?.contactNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Medical Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Medical Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p><span className="font-medium">Diagnosis:</span> {selectedCert.medicalDetails?.diagnosis || 'N/A'}</p>
                    <p><span className="font-medium">Date From:</span> {formatDate(selectedCert.medicalDetails?.dateFrom)}</p>
                    <p><span className="font-medium">Date To:</span> {formatDate(selectedCert.medicalDetails?.dateTo)}</p>
                    <p><span className="font-medium">Rest Days:</span> {selectedCert.medicalDetails?.restDays || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p><span className="font-medium">Follow-up Date:</span> {formatDate(selectedCert.medicalDetails?.followUpDate)}</p>
                    <p><span className="font-medium">Restrictions:</span> {selectedCert.medicalDetails?.restrictions || 'N/A'}</p>
                    <p><span className="font-medium">Recommendations:</span> {selectedCert.medicalDetails?.recommendations || 'N/A'}</p>
                    <p><span className="font-medium">Remarks:</span> {selectedCert.medicalDetails?.remarks || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Doctor Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Attending Physician</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> Dr. {selectedCert.doctor?.fullName || 'N/A'}</p>
                    <p><span className="font-medium">PRC ID:</span> {selectedCert.doctor?.prcId || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p><span className="font-medium">Specialty:</span> {selectedCert.doctor?.specialty || 'N/A'}</p>
                    <p><span className="font-medium">Contact:</span> {selectedCert.doctor?.contactNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Digital Signature */}
              {selectedCert.digitalSignature && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Digital Signature</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <img 
                      src={selectedCert.digitalSignature} 
                      alt="Digital Signature" 
                      className="max-w-xs h-auto border border-gray-300 rounded"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Signed: {selectedCert.isSigned ? 'Yes' : 'No'} 
                      {selectedCert.isSigned && selectedCert.signedDate && (
                        <span> on {formatDateTime(selectedCert.signedDate)}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleDownloadCertificate(selectedCert)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setShowCertModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientMedicalCertTab;   