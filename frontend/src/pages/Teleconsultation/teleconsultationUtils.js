// Teleconsultation utility functions

/**
 * Generate a unique meeting room ID for Jitsi Meet
 * @returns {string} Unique room ID
 */
export const generateMeetingRoomId = () => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substr(2, 9);
  return `odyssey-consultation-${timestamp}-${randomString}`;
};

/**
 * Create Jitsi Meet URL with configuration
 * @param {string} roomId - The meeting room ID
 * @param {string} displayName - User's display name
 * @param {Object} config - Additional Jitsi configuration
 * @returns {string} Complete Jitsi Meet URL
 */
export const createJitsiMeetUrl = (roomId, displayName, config = {}) => {
  const domain = 'meet.jit.si';
  const baseUrl = `https://${domain}/${roomId}`;
  
  const defaultConfig = {
    startWithAudioMuted: true,
    startWithVideoMuted: false,
    enableWelcomePage: false,
    ...config
  };
  
  const configParams = Object.entries(defaultConfig)
    .map(([key, value]) => `config.${key}=${value}`)
    .join('&');
    
  const userInfo = `userInfo.displayName="${encodeURIComponent(displayName)}"`;
  
  return `${baseUrl}#${userInfo}&${configParams}`;
};

/**
 * Calculate time difference between now and consultation time
 * @param {string} date - Consultation date (YYYY-MM-DD)
 * @param {string} time - Consultation time (HH:MM)
 * @returns {Object} Time difference object
 */
export const getTimeUntilConsultation = (date, time) => {
  const consultationDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  const timeDiff = consultationDateTime.getTime() - now.getTime();
  
  if (timeDiff <= 0) {
    return { isPast: true, display: "Past due" };
  }
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  let display = "";
  if (days > 0) {
    display = `${days}d ${hours}h`;
  } else if (hours > 0) {
    display = `${hours}h ${minutes}m`;
  } else {
    display = `${minutes}m`;
  }
  
  return {
    isPast: false,
    days,
    hours,
    minutes,
    display,
    totalMinutes: Math.floor(timeDiff / (1000 * 60))
  };
};

/**
 * Get consultation urgency level based on time remaining
 * @param {string} date - Consultation date
 * @param {string} time - Consultation time
 * @returns {string} Urgency level (high, medium, low)
 */
export const getConsultationUrgency = (date, time) => {
  const timeInfo = getTimeUntilConsultation(date, time);
  
  if (timeInfo.isPast) return 'past';
  if (timeInfo.totalMinutes <= 15) return 'high';
  if (timeInfo.totalMinutes <= 60) return 'medium';
  return 'low';
};

/**
 * Format consultation date and time for display
 * @param {string} date - Consultation date
 * @param {string} time - Consultation time
 * @returns {string} Formatted date and time
 */
export const formatConsultationDateTime = (date, time) => {
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

/**
 * Check if user can join consultation (within 15 minutes of start time)
 * @param {string} date - Consultation date
 * @param {string} time - Consultation time
 * @returns {boolean} Whether user can join
 */
export const canJoinConsultation = (date, time) => {
  const consultationDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  const timeDiff = consultationDateTime.getTime() - now.getTime();
  const minutesUntil = timeDiff / (1000 * 60);
  
  // Allow joining 15 minutes before to 30 minutes after scheduled time
  return minutesUntil <= 15 && minutesUntil >= -30;
};

/**
 * Validate consultation data before saving
 * @param {Object} consultationData - Consultation data to validate
 * @returns {Object} Validation result
 */
export const validateConsultationData = (consultationData) => {
  const errors = [];
  
  if (!consultationData.title?.trim()) {
    errors.push("Title is required");
  }
  
  if (!consultationData.scheduledDate) {
    errors.push("Date is required");
  }
  
  if (!consultationData.scheduledTime) {
    errors.push("Time is required");
  }
  
  if (!consultationData.doctorId) {
    errors.push("Doctor selection is required");
  }
  
  if (!consultationData.patientId) {
    errors.push("Patient selection is required");
  }
  
  // Check if date is in the future
  const consultationDateTime = new Date(`${consultationData.scheduledDate}T${consultationData.scheduledTime}`);
  const now = new Date();
  
  if (consultationDateTime <= now) {
    errors.push("Consultation must be scheduled for a future date and time");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Send notification to user about consultation
 * @param {string} userId - User ID to notify
 * @param {string} consultationId - Consultation ID
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 */
export const sendConsultationNotification = async (userId, consultationId, type, message) => {
  try {
    const notificationsRef = ref(database, 'notifications');
    const notificationData = {
      userId,
      consultationId,
      type,
      title: "Teleconsultation Update",
      message,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    await push(notificationsRef, notificationData);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

/**
 * Get CSS classes for urgency level
 * @param {string} urgency - Urgency level
 * @returns {string} CSS classes
 */
export const getUrgencyClasses = (urgency) => {
  switch (urgency) {
    case 'high':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'medium':
      return 'bg-orange-50 border-orange-200 text-orange-800';
    case 'low':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'past':
      return 'bg-gray-50 border-gray-200 text-gray-500';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-600';
  }
};