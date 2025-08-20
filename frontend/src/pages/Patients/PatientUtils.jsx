// Utility functions for patient data handling

export const formatTimestamp = (timestamp) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (error) {
    return timestamp;
  }
};

export const getStatusBadge = (status) => {
  const statusStyles = {
    completed: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    in_progress: "bg-blue-100 text-blue-700 border-blue-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };
  return statusStyles[status] || "bg-gray-100 text-gray-700 border-gray-200";
};

export const formatMedicalConditions = (medicalConditions) => {
  if (!medicalConditions) return [];
  
  if (typeof medicalConditions === "string") {
    return medicalConditions
      .split(/[,;]/)
      .map((condition, index) => ({
        id: index,
        condition: condition.trim(),
        description: "",
        dateRecorded: "N/A"
      }))
      .filter(item => item.condition);
  }
  
  if (typeof medicalConditions === "object") {
    return Object.entries(medicalConditions).map(([key, value], index) => ({
      id: index,
      condition: key,
      description: typeof value === "string" ? value : JSON.stringify(value),
      dateRecorded: "N/A"
    }));
  }
  
  return [];
};

export const getTestName = (serviceId, fallbackName, medicalServices) => {
  if (medicalServices[serviceId]) {
    return medicalServices[serviceId].name;
  }
  return fallbackName || "Unknown Test";
};

export const getUserName = (userId, fallbackName, users) => {
  if (userId && users[userId]) {
    const user = users[userId];
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName} ${lastName}`.trim() || fallbackName || "Unknown User";
  }
  return fallbackName || "Unknown User";
};