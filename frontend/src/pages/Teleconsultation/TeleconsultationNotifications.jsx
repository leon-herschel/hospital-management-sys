import { useState, useEffect } from "react";
import { 
  BellIcon, 
  VideoCameraIcon, 
  XMarkIcon,
  ClockIcon 
} from "@heroicons/react/24/outline";
import { database } from "../../firebase/firebase";
import { ref, onValue, update } from "firebase/database";
import { useAuth } from "../../context/authContext/authContext";

const TeleconsultationNotifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [upcomingConsultations, setUpcomingConsultations] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    // Listen for teleconsultations
    const consultationsRef = ref(database, 'teleconsultations');
    const unsubscribe = onValue(consultationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const consultationsList = Object.entries(data)
          .map(([id, consultation]) => ({
            id,
            ...consultation
          }))
          .filter(consultation => {
            // Show consultations for current user (doctor or patient)
            return (consultation.doctorId === currentUser.uid || 
                    consultation.patientId === currentUser.uid) &&
                   consultation.status === 'scheduled';
          });

        // Check for upcoming consultations (within next 24 hours)
        const now = new Date();
        const upcoming = consultationsList.filter(consultation => {
          const consultationDateTime = new Date(`${consultation.scheduledDate}T${consultation.scheduledTime}`);
          const timeDiff = consultationDateTime.getTime() - now.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          // Show notifications for consultations within next 24 hours
          return hoursDiff > 0 && hoursDiff <= 24;
        });

        setUpcomingConsultations(upcoming);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const formatTimeUntil = (date, time) => {
    const consultationDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const timeDiff = consultationDateTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) return "Starting soon";
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getUrgencyColor = (date, time) => {
    const consultationDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const timeDiff = consultationDateTime.getTime() - now.getTime();
    const minutes = timeDiff / (1000 * 60);
    
    if (minutes <= 15) return "text-red-600 bg-red-50 border-red-200";
    if (minutes <= 60) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-blue-600 bg-blue-50 border-blue-200";
  };

  const handleJoinConsultation = (consultation) => {
    const displayName = currentUser.displayName || currentUser.email || 'User';
    const domain = 'meet.jit.si';
    const roomName = consultation.meetingRoomId;
    
    const jitsiUrl = `https://${domain}/${roomName}#userInfo.displayName="${encodeURIComponent(displayName)}"`;
    
    window.open(jitsiUrl, 'jitsi-meet', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <BellIcon className="w-6 h-6" />
        {upcomingConsultations.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {upcomingConsultations.length > 9 ? '9+' : upcomingConsultations.length}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Consultations</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {upcomingConsultations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <VideoCameraIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No upcoming consultations</p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {upcomingConsultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className={`p-3 rounded-lg border ${getUrgencyColor(consultation.scheduledDate, consultation.scheduledTime)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{consultation.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {consultation.doctorId === currentUser.uid 
                            ? `Patient: ${consultation.patientName}`
                            : `Dr. ${consultation.doctorName}`
                          }
                        </p>
                        <div className="flex items-center mt-2 text-xs">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          <span>
                            {formatTimeUntil(consultation.scheduledDate, consultation.scheduledTime)} remaining
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleJoinConsultation(consultation)}
                        className="ml-2 px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors flex items-center"
                      >
                        <VideoCameraIcon className="w-3 h-3 mr-1" />
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {upcomingConsultations.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowNotifications(false);
                  // Navigate to teleconsultation page
                  window.location.href = '/teleconsultation';
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Consultations
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeleconsultationNotifications;