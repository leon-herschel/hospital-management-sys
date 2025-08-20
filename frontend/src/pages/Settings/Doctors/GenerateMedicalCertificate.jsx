import React, { useState, useRef, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/authContext/authContext';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../firebase/firebase'; // Adjust import path as needed

const GenerateMedicalCertificate = () => {
  const { currentUser } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [certificateData, setCertificateData] = useState({
    diagnosis: '',
    recommendations: '',
    restDays: '',
    dateFrom: '',
    dateTo: '',
    remarks: '',
    followUpDate: '',
    restrictions: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const certificateRef = useRef();

  // Fetch current doctor from Firebase
  useEffect(() => {
    if (currentUser) {
      const doctorsRef = ref(database, "doctors");

      const unsubscribe = onValue(doctorsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Find the doctor that matches the current user
          const doctorEntry = Object.entries(data).find(([key, doctor]) => {
            return doctor.email === currentUser.email || 
                   doctor.userId === currentUser.uid ||
                   doctor.fullName === currentUser.displayName ||
                   key === currentUser.uid;
          });

          if (doctorEntry) {
            const [doctorId, doctorData] = doctorEntry;
            setCurrentDoctor({
              id: doctorId,
              fullName: doctorData.fullName || `${doctorData.firstName || ''} ${doctorData.lastName || ''}`.trim(),
              firstName: doctorData.firstName || '',
              lastName: doctorData.lastName || '',
              contactNumber: doctorData.contactNumber || '',
              department: doctorData.department || '',
              specialty: doctorData.specialty || '',
              prcId: doctorData.prcId || '',
              prcExpiry: doctorData.prcExpiry || '',
              isGeneralist: doctorData.isGeneralist || false,
              professionalFees: doctorData.professionalFees || {}
            });
          } else {
            setCurrentDoctor(null);
          }
        }
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  // Helper function to calculate age from dateOfBirth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch patients from Firebase
  useEffect(() => {
    const patientsRef = ref(database, "patients");

    const unsubscribe = onValue(patientsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const patientsArray = Object.entries(data).map(([key, value]) => {
          // Construct full name
          const fullName = [value.firstName, value.middleName, value.lastName]
            .filter(name => name && name.trim())
            .join(' ');

          return {
            id: key,
            name: fullName,
            patientId: key,
            firstName: value.firstName || '',
            lastName: value.lastName || '',
            middleName: value.middleName || '',
            age: calculateAge(value.dateOfBirth),
            dateOfBirth: value.dateOfBirth || '',
            gender: value.gender || '',
            contactNumber: value.contactNumber || '',
            address: value.address || 'N/A',
            clinicId: value.clinicId || '',
            primaryClinic: value.primaryClinic || '',
            status: value.status || '',
            emergencyContact: value.emergencyContact || {},
            medicalConditions: value.medicalConditions || []
          };
        });
        
        const activePatients = patientsArray.filter(patient => 
          patient.status === 'Active' && patient.name.trim()
        );
        
        setPatients(activePatients);
      } else {
        setPatients([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(false);
    setSearchTerm('');
  };

  const handleInputChange = (field, value) => {
    setCertificateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGeneratePreview = () => {
    if (!selectedPatient || !certificateData.diagnosis) {
      alert('Please select a patient and provide a diagnosis.');
      return;
    }
    setShowPreview(true);
  };

  const handleDownloadPDF = async () => {
    if (!selectedPatient) return;

    setIsDownloading(true);
    
    try {
      // Dynamically import the libraries
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      const element = certificateRef.current;
      
      // Configure html2canvas options for better quality
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions to fit the content properly
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate the ratio to fit the image in the PDF
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
      const finalWidth = imgWidth * ratio * 0.264583;
      const finalHeight = imgHeight * ratio * 0.264583;
      
      // Center the image
      const x = (pdfWidth - finalWidth) / 2;
      const y = 10; // Small margin from top

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

      // Generate filename with patient name and date
      const currentDate = new Date().toISOString().split('T')[0];
      const fileName = `Medical_Certificate_${selectedPatient.name.replace(/\s+/g, '_')}_${currentDate}.pdf`;

      // Download the PDF
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center space-x-3">
            <ClipboardDocumentCheckIcon className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Generate Medical Certificate</h1>
              <p className="text-blue-100">Create official medical certificates for patients</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!showPreview ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Patient Selection & Form */}
              <div className="space-y-6">
                {/* Patient Selection */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Patient Selection
                  </h3>
                  
                  {!selectedPatient ? (
                    <button
                      onClick={() => setShowPatientModal(true)}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2 text-gray-600 hover:text-blue-600"
                    >
                      <MagnifyingGlassIcon className="w-5 h-5" />
                      <span>Click to select patient</span>
                    </button>
                  ) : (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">{selectedPatient.name}</h4>
                          <p className="text-gray-600">ID: {selectedPatient.patientId}</p>
                          <p className="text-sm text-gray-500">
                            {selectedPatient.age} years old • {selectedPatient.gender}
                          </p>
                          <p className="text-sm text-gray-500">{selectedPatient.contactNumber}</p>
                          {selectedPatient.dateOfBirth && (
                            <p className="text-sm text-gray-500">
                              DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedPatient(null)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Certificate Form */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Certificate Details
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diagnosis / Medical Condition *
                    </label>
                    <textarea
                      value={certificateData.diagnosis}
                      onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter primary diagnosis or medical condition..."
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rest Period (Days)
                      </label>
                      <input
                        type="number"
                        value={certificateData.restDays}
                        onChange={(e) => handleInputChange('restDays', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Number of days"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Follow-up Date
                      </label>
                      <input
                        type="date"
                        value={certificateData.followUpDate}
                        onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date From
                      </label>
                      <input
                        type="date"
                        value={certificateData.dateFrom}
                        onChange={(e) => handleInputChange('dateFrom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date To
                      </label>
                      <input
                        type="date"
                        value={certificateData.dateTo}
                        onChange={(e) => handleInputChange('dateTo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medical Recommendations
                    </label>
                    <textarea
                      value={certificateData.recommendations}
                      onChange={(e) => handleInputChange('recommendations', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Treatment recommendations, medications, etc..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work/Activity Restrictions
                    </label>
                    <textarea
                      value={certificateData.restrictions}
                      onChange={(e) => handleInputChange('restrictions', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Any specific restrictions or limitations..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Remarks
                    </label>
                    <textarea
                      value={certificateData.remarks}
                      onChange={(e) => handleInputChange('remarks', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Any additional notes or remarks..."
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Instructions */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Instructions</h3>
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-start space-x-3">
                    <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>Select the patient from the database for whom you want to generate the medical certificate.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>Fill in the diagnosis or medical condition accurately. This is a required field.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>Specify the rest period in days if medical leave is required.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>Add any work restrictions or activity limitations as needed.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>Include follow-up dates and additional recommendations for comprehensive care.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>Review the preview before downloading to ensure all information is accurate.</p>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Important Note</h4>
                  <p className="text-sm text-blue-700">
                    Medical certificates are legal documents. Ensure all information is accurate and complete before issuing. 
                    The certificate will be digitally signed with your credentials and downloaded as a PDF.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Certificate Preview */
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Certificate Preview</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>{isDownloading ? 'Generating PDF...' : 'Download PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Certificate Template */}
              <div ref={certificateRef} className="bg-white border border-gray-300 rounded-lg p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Times New Roman, serif' }}>
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-2xl">HMS</span>
                  </div>
                  <h1 className="text-2xl font-bold text-blue-900 mb-2">ODYSSEY MANAGEMENT SYSTEM</h1>
                  <p className="text-sm text-gray-600 mb-4">
                    123 Medical Center Drive, Cebu city, Cebu<br />
                    Tel: (053) 123-4567 | Email: info@hms.ph
                  </p>
                  <h2 className="text-xl font-bold underline">MEDICAL CERTIFICATE</h2>
                </div>

                {/* Certificate Body */}
                <div className="space-y-4 text-justify">
                  <div className="mb-6">
                    <p className="mb-4">TO WHOM IT MAY CONCERN:</p>
                    <p className="mb-4">
                      This is to certify that <strong>{selectedPatient?.name}</strong>, 
                      {selectedPatient?.age} years of age, {selectedPatient?.gender.toLowerCase()}, 
                      has been under my professional care and medical supervision.
                    </p>
                  </div>

                  {/* Patient Information */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="font-bold mb-3">PATIENT INFORMATION:</h4>
                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      <div><span className="font-medium">Full Name:</span> {selectedPatient?.name}</div>
                      <div><span className="font-medium">Patient ID:</span> {selectedPatient?.patientId}</div>
                      <div><span className="font-medium">Age:</span> {selectedPatient?.age} years old</div>
                      <div><span className="font-medium">Gender:</span> {selectedPatient?.gender}</div>
                      {selectedPatient?.dateOfBirth && (
                        <div><span className="font-medium">Date of Birth:</span> {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</div>
                      )}
                      <div><span className="font-medium">Contact:</span> {selectedPatient?.contactNumber}</div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold">DIAGNOSIS/MEDICAL CONDITION:</h4>
                      <p className="ml-4">{certificateData.diagnosis}</p>
                    </div>

                    {certificateData.recommendations && (
                      <div>
                        <h4 className="font-bold">MEDICAL RECOMMENDATIONS:</h4>
                        <p className="ml-4">{certificateData.recommendations}</p>
                      </div>
                    )}

                    {certificateData.restDays && (
                      <div>
                        <h4 className="font-bold">RECOMMENDED REST PERIOD:</h4>
                        <p className="ml-4">{certificateData.restDays} day(s) of medical leave is recommended.</p>
                      </div>
                    )}

                    {(certificateData.dateFrom && certificateData.dateTo) && (
                      <div>
                        <h4 className="font-bold">PERIOD OF INCAPACITY:</h4>
                        <p className="ml-4">
                          From {new Date(certificateData.dateFrom).toLocaleDateString()} 
                          to {new Date(certificateData.dateTo).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {certificateData.restrictions && (
                      <div>
                        <h4 className="font-bold">WORK/ACTIVITY RESTRICTIONS:</h4>
                        <p className="ml-4">{certificateData.restrictions}</p>
                      </div>
                    )}

                    {certificateData.followUpDate && (
                      <div>
                        <h4 className="font-bold">FOLLOW-UP CONSULTATION:</h4>
                        <p className="ml-4">Scheduled for {new Date(certificateData.followUpDate).toLocaleDateString()}</p>
                      </div>
                    )}

                    {certificateData.remarks && (
                      <div>
                        <h4 className="font-bold">ADDITIONAL REMARKS:</h4>
                        <p className="ml-4">{certificateData.remarks}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-8">
                    <p>This certificate is issued upon request of the patient for whatever legal purpose it may serve.</p>
                    <p className="mt-4">Given this <strong>{getCurrentDate()}</strong> at Cebu City, Philippines.</p>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <div className="inline-block">
                    <div className="border-b border-black w-80 mb-2"></div>
                    <div>
                      <p className="font-bold">
                        Dr. {currentDoctor?.fullName || currentUser?.displayName || 'Doctor Name'}
                      </p>
                      <p className="text-sm">Attending Physician</p>
                      <p className="text-sm">
                        License No: {currentDoctor?.prcId || 'PRC-123456'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                  <p>This is a computer-generated medical certificate. Valid without signature if digitally verified.</p>
                  <p>Certificate ID: MC-{Date.now()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          {!showPreview && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleGeneratePreview}
                disabled={!selectedPatient || !certificateData.diagnosis}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <DocumentTextIcon className="w-5 h-5" />
                <span>Generate Certificate Preview</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Patient Selection Modal */}
      {showPatientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">Select Patient</h3>
              <button
                onClick={() => setShowPatientModal(false)}
                className="text-white hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Search */}
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or patient ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Patient List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{patient.name}</h4>
                        <p className="text-sm text-gray-600">ID: {patient.patientId}</p>
                        <p className="text-sm text-gray-500">
                          {patient.age} years old • {patient.gender}
                        </p>
                        {patient.dateOfBirth && (
                          <p className="text-sm text-gray-500">
                            DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{patient.contactNumber}</p>
                        <p className="text-xs">{patient.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredPatients.length === 0 && searchTerm && (
                  <div className="text-center py-8 text-gray-500">
                    <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No patients found matching "{searchTerm}".</p>
                  </div>
                )}
                
                {patients.length === 0 && !searchTerm && (
                  <div className="text-center py-8 text-gray-500">
                    <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No patients available. Please add patients first.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateMedicalCertificate;