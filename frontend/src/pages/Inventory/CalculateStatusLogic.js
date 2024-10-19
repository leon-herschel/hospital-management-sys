export const calculateStatus = (quantity, maxQuantity) => {
    console.log("Calculating status:", { quantity, maxQuantity }); // Debugging
    if (!maxQuantity || maxQuantity === 0) {
      return "Unknown"; // Handle cases where maxQuantity is missing or zero
    }
  
    const percentage = (quantity / maxQuantity) * 100;
    console.log("Percentage:", percentage); // Debugging
  
    if (percentage >= 70) {
      return "Sufficient";
    } else if (percentage >= 50) {
      return "Moderate";
    } else if (percentage >= 49) {
        return "Low Stock";
      } else {
        return "Very Low";  // New status for below 30%
      }
  };
  