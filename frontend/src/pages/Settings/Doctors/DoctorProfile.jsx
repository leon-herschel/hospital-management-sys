import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/authContext/authContext';
import { useNavigate } from 'react-router-dom';
import { ref, get, onValue } from 'firebase/database';
import { database } from '../../../firebase/firebase';
import AvailabilityModal from './AvailabilityModal';
import ProfessionalFeeModal from './ProfessionalFeeModal';
import { PencilIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const DoctorProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [doctorData, setDoctorData] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [professionalFees, setProfessionalFees] = useState(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signatureCount, setSignatureCount] = useState(0);
  const [activeSignature, setActiveSignature] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    fetchDoctorData();
  }, [currentUser, navigate]);

  const fetchDoctorData = async () => {
    try {
      const doctorId = currentUser.uid; 

      // First get user data
      const userRef = ref(database, `users/${doctorId}`);
      const userSnapshot = await get(userRef);

      if (!userSnapshot.exists() || userSnapshot.val().role !== 'doctor') {
        console.error('User is not a doctor or does not exist');
        navigate('/dashboard');
        return;
      }

      const userData = userSnapshot.val();

      // Then get doctor data
      const doctorRef = ref(database, `doctors/${doctorId}`);
      const doctorSnapshot = await get(doctorRef);

      if (doctorSnapshot.exists()) {
        const doctorInfo = doctorSnapshot.val();
        setDoctorData({ ...doctorInfo, email: userData.email, id: doctorId });
      } else {
        // Doctor record doesn't exist, create it
        const newDoctorData = {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          fullName: `Dr. ${userData.firstName} ${userData.lastName}`.trim(),
          email: userData.email,
          specialty: userData.department || 'General Medicine',
          contactNumber: userData.contactNumber || '',
          clinicAffiliations: userData.clinicAffiliation ? [userData.clinicAffiliation] : [],
          birNumber: userData.birNumber || '',
          prcId: userData.prcId || '',
        };

        await update(doctorRef, newDoctorData);
        setDoctorData({ ...newDoctorData, id: doctorId });
      }

      // Availability listener
      const availabilityRef = ref(database, `doctors/${doctorId}/availability`);
      const unsubscribeAvailability = onValue(availabilityRef, (snapshot) => {
        setAvailability(snapshot.exists() ? snapshot.val() : null);
      });

      // Fees listener
      const feesRef = ref(database, `doctors/${doctorId}/professionalFees`);
      const unsubscribeFees = onValue(feesRef, (snapshot) => {
        setProfessionalFees(snapshot.exists() ? snapshot.val() : null);
      });

      // Signatures listener
      const signaturesRef = ref(database, `doctorSignatures/${doctorId}`);
      const unsubscribeSignatures = onValue(signaturesRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const signaturesArray = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value
          }));
          setSignatureCount(signaturesArray.length);
          
          const active = signaturesArray.find(sig => sig.isActive);
          setActiveSignature(active || null);
        } else {
          setSignatureCount(0);
          setActiveSignature(null);
        }
      });

      setLoading(false);

      return () => {
        unsubscribeAvailability();
        unsubscribeFees();
        unsubscribeSignatures();
      };
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      setLoading(false);
    }
  };

  const formatTimeSlot = (slot) => {
    return `${slot.startTime} - ${slot.endTime}`;
  };

  const formatAvailability = (availability) => {
    if (!availability || !availability.weeklySchedule) return 'No availability set';

    const weeklySchedule = availability.weeklySchedule;
    const enabledDays = Object.entries(weeklySchedule)
      .filter(([day, data]) => data.enabled && data.timeSlots.length > 0)
      .map(([day, data]) => {
        const timeSlots = data.timeSlots.map(formatTimeSlot).join(', ');
        return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${timeSlots}`;
      });

    return enabledDays.length > 0 ? enabledDays.join('\n') : 'No weekly schedule set';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {doctorData?.fullName?.charAt(0) || 'D'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dr. {doctorData?.fullName || 'Doctor'}
                </h1>
                <p className="text-gray-600">{doctorData?.department} Department</p>
                <p className="text-gray-500 text-sm">{doctorData?.email}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Digital Signature Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <PencilIcon className="w-6 h-6" />
                <span>Digital Signature</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Manage your signature for medical certificates</p>
            </div>
            <button
              onClick={() => navigate('/import-signature')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <span>Manage Signatures</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            {activeSignature ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white rounded-lg p-3 border-2 border-green-300">
                    <img
                      src={activeSignature.base64Data}
                      alt="Active signature"
                      className="max-h-16 max-w-xs"
                      style={{ filter: 'none' }}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 flex items-center">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Active Signature
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {signatureCount} signature{signatureCount !== 1 ? 's' : ''} saved
                    </p>
                    <p className="text-xs text-gray-500">
                      Last updated: {new Date(activeSignature.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <PencilIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No Active Signature</p>
                <p className="text-sm text-gray-500 mt-1">
                  {signatureCount > 0 
                    ? `${signatureCount} signature${signatureCount !== 1 ? 's' : ''} saved (none active)`
                    : 'Upload or draw your signature to get started'}
                </p>
                <button
                  onClick={() => navigate('/import-signature')}
                  className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Add Signature →
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Availability Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Availability</h2>
              <button
                onClick={() => setShowAvailabilityModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Manage Availability
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Weekly Schedule</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {formatAvailability(availability)}
                  </pre>
                </div>
              </div>

              {availability?.specificDates && Object.keys(availability.specificDates).length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Specific Dates</h3>
                  <div className="bg-gray-50 p-4 rounded-md space-y-2">
                    {Object.entries(availability.specificDates).map(([date, data]) => (
                      <div key={date} className="text-sm">
                        <span className="font-medium">{date}:</span>
                        <span className="ml-2 text-gray-600">
                          {data.timeSlots.map(formatTimeSlot).join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Professional Fees Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Professional Fees</h2>
              <button
                onClick={() => setShowFeesModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Set Fees
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Consultation Fee:</span>
                    <span className="text-lg font-semibold text-green-600">
                      ₱{professionalFees?.consultationFee?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Follow-up Fee:</span>
                    <span className="text-lg font-semibold text-green-600">
                      ₱{professionalFees?.followUpFee?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  {/* <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Referral Fee:</span>
                    <span className="text-lg font-semibold text-green-600">
                      ₱{professionalFees?.referralFee?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Patronage Fee:</span>
                    <span className="text-lg font-semibold text-green-600">
                      ₱{professionalFees?.patronageFee?.toFixed(2) || '0.00'}
                    </span>
                  </div> */}
                </div>
              </div>
              
              {!professionalFees && (
                <div className="text-center py-4 text-gray-500">
                  <p>No professional fees set yet.</p>
                  <p className="text-sm">Click "Set Fees" to configure your consultation rates.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Basic Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Full Name:</span> Dr. {doctorData?.fullName}</div>
                <div><span className="font-medium">Email:</span> {doctorData?.email}</div>
                <div><span className="font-medium">Department:</span> {doctorData?.department}</div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">System Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Doctor ID:</span> {doctorData?.id}</div>
                <div><span className="font-medium">Account Type:</span> Doctor</div>
                <div><span className="font-medium">Status:</span> 
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAvailabilityModal && doctorData && (
        <AvailabilityModal
          doctor={doctorData}
          onClose={() => setShowAvailabilityModal(false)}
        />
      )}

      {showFeesModal && doctorData && (
        <ProfessionalFeeModal
          doctor={doctorData}
          onClose={() => setShowFeesModal(false)}
        />
      )}
    </div>
  );
};

export default DoctorProfile;