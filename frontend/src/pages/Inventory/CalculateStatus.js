// src/utils/calculateStatus.js

/**
 * Calculates the status of an inventory item based on its current quantity
 * and maximum quantity.
 *
 * @param {number} currentQuantity - The current quantity of the item.
 * @param {number} maxQuantity - The maximum quantity capacity for the item.
 * @returns {string} - Returns "Low" if below 50%, otherwise "Good".
 */
export function calculateStatus(currentQuantity, maxQuantity) {
  if (maxQuantity <= 0) return "Low"; // Prevent division errors

  const threshold = maxQuantity * 0.5; // 50% of the max quantity
  return currentQuantity < threshold ? "Low" : "Good";
}
