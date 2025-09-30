import { useState } from "react";
import { XMarkIcon, VideoCameraIcon, UserIcon } from "@heroicons/react/24/outline";

const JoinConsultationModal = ({ isOpen, onClose, consultation }) => {
  const [displayName, setDisplayName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinMeeting = () => {
    if (!displayName.trim()) {
      alert('Please enter your display name');
      return;
    }

    setIsJoining(true);

    // Create Jitsi Meet URL
    const domain = 'meet.jit.si';
    const roomName = consultation.meetingRoomId;
    
    // Jitsi Meet URL with parameters
    const jitsiUrl = `https://${domain}/${roomName}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.startWithAudioMuted=true&config.startWithVideoMuted=false`;

    // Open Jitsi Meet in a new window
    const meetWindow = window.open(
      jitsiUrl,
      'jitsi-meet',
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );

    if (meetWindow) {
      // Check if the window is closed
      const checkClosed = setInterval(() => {
        if (meetWindow.closed) {
          clearInterval(checkClosed);
          setIsJoining(false);
          onClose();
        }
      }, 1000);
    } else {
      // Fallback if popup is blocked
      window.location.href = jitsiUrl;
    }
  };

  const formatDateTime = (date, time) => {
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isOpen || !consultation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <VideoCameraIcon className="w-6 h-6 mr-2 text-blue-600" />
            Join Consultation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Consultation Details */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-gray-900">{consultation.title}</h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4" />
                <span>Dr. {consultation.doctorName}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4" />
                <span>Patient: {consultation.patientName}</span>
              </div>
              
              <div>
                <strong>Scheduled:</strong> {formatDateTime(consultation.scheduledDate, consultation.scheduledTime)}
              </div>
              
              {consultation.description && (
                <div>
                  <strong>Description:</strong> {consultation.description}
                </div>
              )}
            </div>
          </div>

          {/* Display Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name for the meeting"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Meeting Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Before Joining:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Ensure you have a stable internet connection</li>
              <li>• Check your camera and microphone</li>
              <li>• Find a quiet, well-lit location</li>
              <li>• Allow browser permissions for camera/microphone</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isJoining}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleJoinMeeting}
              disabled={isJoining || !displayName.trim()}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isJoining ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining...
                </>
              ) : (
                <>
                  <VideoCameraIcon className="w-4 h-4 mr-2" />
                  Join Meeting
                </>
              )}
            </button>
          </div>

          {/* Technical Note */}
          <div className="text-xs text-gray-500 text-center pt-2">
            This will open Jitsi Meet in a new window. If blocked by popup blocker, 
            you'll be redirected to the meeting page.
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinConsultationModal;