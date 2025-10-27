// utils/databaseQuery.js
import { ref, get, query, orderByChild } from 'firebase/database';

/**
 * Analyzes user query and fetches relevant database context
 */
export const queryDatabaseContext = async (userMessage, database) => {
  const lowerMessage = userMessage.toLowerCase();
  let contextParts = [];

  try {
    // Check for diagnosis-related queries
    if (lowerMessage.includes('diagnos') || lowerMessage.includes('common') || 
        lowerMessage.includes('frequent') || lowerMessage.includes('condition')) {
      const diagnosisContext = await queryDiagnoses(database, lowerMessage);
      if (diagnosisContext) contextParts.push(diagnosisContext);
    }

    // Check for inventory-related queries
    if (lowerMessage.includes('inventory') || lowerMessage.includes('stock') || 
        lowerMessage.includes('supply') || lowerMessage.includes('supplies')) {
      const inventoryContext = await queryInventory(database, lowerMessage);
      if (inventoryContext) contextParts.push(inventoryContext);
    }

    // Check for clinic-related queries
    if (lowerMessage.includes('clinic') || lowerMessage.includes('location') || 
        lowerMessage.includes('facility')) {
      const clinicContext = await queryClinics(database);
      if (clinicContext) contextParts.push(clinicContext);
    }

    return contextParts.length > 0 ? contextParts.join('\n\n') : null;

  } catch (error) {
    console.error('Error querying database context:', error);
    return null;
  }
};

/**
 * Query diagnoses from patient medical history
 */
const queryDiagnoses = async (database, userMessage) => {
  try {
    const medicalHistoryRef = ref(database, 'patientMedicalHistory');
    const snapshot = await get(medicalHistoryRef);

    if (!snapshot.exists()) {
      return 'No diagnosis data available in the system.';
    }

    const diagnosisMap = new Map();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Check if query is asking for specific time period
    const isMonthQuery = userMessage.includes('month') || userMessage.includes('this month');
    const isWeekQuery = userMessage.includes('week') || userMessage.includes('this week');

    snapshot.forEach((patientSnapshot) => {
      const entries = patientSnapshot.val().entries;
      if (entries) {
        Object.values(entries).forEach((entry) => {
          if (entry.diagnoses && entry.updatedAt) {
            const entryDate = new Date(entry.updatedAt);
            
            // Filter by time period if specified
            let includeEntry = true;
            if (isMonthQuery) {
              includeEntry = entryDate.getMonth() === currentMonth && 
                           entryDate.getFullYear() === currentYear;
            } else if (isWeekQuery) {
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              includeEntry = entryDate >= weekAgo;
            }

            if (includeEntry) {
              entry.diagnoses.forEach((diagnosis) => {
                const key = `${diagnosis.code}-${diagnosis.description}`;
                const existing = diagnosisMap.get(key);
                if (existing) {
                  existing.count++;
                  existing.lastSeen = Math.max(existing.lastSeen, entryDate.getTime());
                } else {
                  diagnosisMap.set(key, {
                    code: diagnosis.code,
                    description: diagnosis.description,
                    count: 1,
                    lastSeen: entryDate.getTime()
                  });
                }
              });
            }
          }
        });
      }
    });

    if (diagnosisMap.size === 0) {
      return 'No diagnoses found for the specified period.';
    }

    // Sort by frequency
    const sortedDiagnoses = Array.from(diagnosisMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Top 15

    const period = isMonthQuery ? 'this month' : isWeekQuery ? 'this week' : 'in the system';
    let context = `DIAGNOSIS STATISTICS (${period}):\n`;
    context += `Total unique diagnoses: ${diagnosisMap.size}\n\n`;
    context += 'Most Common Diagnoses:\n';
    
    sortedDiagnoses.forEach((diag, index) => {
      context += `${index + 1}. ${diag.description} (Code: ${diag.code})\n`;
      context += `   - Frequency: ${diag.count} case${diag.count > 1 ? 's' : ''}\n`;
      context += `   - Last recorded: ${new Date(diag.lastSeen).toLocaleDateString()}\n`;
    });

    return context;

  } catch (error) {
    console.error('Error querying diagnoses:', error);
    return null;
  }
};

/**
 * Query inventory stock levels
 */
const queryInventory = async (database, userMessage) => {
  try {
    const inventoryRef = ref(database, 'clinicInventoryStock');
    const clinicsRef = ref(database, 'clinics');
    
    const [inventorySnapshot, clinicsSnapshot] = await Promise.all([
      get(inventoryRef),
      get(clinicsRef)
    ]);

    if (!inventorySnapshot.exists()) {
      return 'No inventory data available.';
    }

    // Build clinic map
    const clinicMap = {};
    if (clinicsSnapshot.exists()) {
      clinicsSnapshot.forEach((clinicSnapshot) => {
        const clinic = clinicSnapshot.val();
        clinicMap[clinicSnapshot.key] = {
          name: clinic.name,
          address: clinic.addressLine,
          type: clinic.type,
          isActive: clinic.isActive
        };
      });
    }

    // Extract specific clinic if mentioned
    let specificClinic = null;
    for (const [clinicId, clinic] of Object.entries(clinicMap)) {
      if (userMessage.toLowerCase().includes(clinic.name.toLowerCase())) {
        specificClinic = clinicId;
        break;
      }
    }

    let context = 'INVENTORY STATUS:\n\n';
    let itemCount = 0;
    let lowStockItems = [];

    inventorySnapshot.forEach((clinicInventorySnapshot) => {
      const clinicId = clinicInventorySnapshot.key;
      
      // Skip if looking for specific clinic and this isn't it
      if (specificClinic && clinicId !== specificClinic) {
        return;
      }

      const clinic = clinicMap[clinicId];
      if (!clinic) return;

      context += `📍 ${clinic.name} (${clinic.address})\n`;
      context += `   Status: ${clinic.isActive ? 'Active' : 'Inactive'}\n`;
      
      const items = clinicInventorySnapshot.val();
      const itemEntries = [];
      
      Object.entries(items).forEach(([itemId, itemData]) => {
        if (itemData.quantity !== undefined) {
          itemCount++;
          const stockLevel = itemData.quantity / itemData.thresholdBase;
          const status = stockLevel < 0.3 ? '🔴 Critical' : 
                        stockLevel < 0.5 ? '🟡 Low' : 
                        '🟢 Good';
          
          itemEntries.push({
            id: itemId,
            quantity: itemData.quantity,
            threshold: itemData.currentThreshold,
            original: itemData.originalQuantity,
            status: status,
            updated: itemData.lastUpdated
          });

          if (stockLevel < 0.5) {
            lowStockItems.push({
              clinic: clinic.name,
              item: itemId,
              quantity: itemData.quantity,
              threshold: itemData.currentThreshold
            });
          }
        }
      });

      if (itemEntries.length > 0) {
        context += `   Total items: ${itemEntries.length}\n`;
        itemEntries.forEach((item) => {
          context += `   - Item ${item.id}: ${item.quantity} units (Threshold: ${item.threshold}) ${item.status}\n`;
        });
        context += '\n';
      }
    });

    if (lowStockItems.length > 0) {
      context += '\n⚠️ LOW STOCK ALERTS:\n';
      lowStockItems.forEach((item) => {
        context += `- ${item.clinic}: Item ${item.item} (${item.quantity}/${item.threshold} units)\n`;
      });
    }

    context += `\nTotal inventory items tracked: ${itemCount}`;

    return context;

  } catch (error) {
    console.error('Error querying inventory:', error);
    return null;
  }
};

/**
 * Query clinic information
 */
const queryClinics = async (database) => {
  try {
    const clinicsRef = ref(database, 'clinics');
    const snapshot = await get(clinicsRef);

    if (!snapshot.exists()) {
      return 'No clinic data available.';
    }

    let context = 'CLINIC INFORMATION:\n\n';
    let activeCount = 0;
    let inactiveCount = 0;

    snapshot.forEach((clinicSnapshot) => {
      const clinic = clinicSnapshot.val();
      if (clinic.isActive) activeCount++;
      else inactiveCount++;

      context += `📍 ${clinic.name}\n`;
      context += `   Address: ${clinic.addressLine}\n`;
      context += `   Type: ${clinic.type}\n`;
      context += `   Contact: ${clinic.contactNumber}\n`;
      context += `   Status: ${clinic.isActive ? '✅ Active' : '❌ Inactive'}\n`;
      context += `   ID: ${clinicSnapshot.key}\n\n`;
    });

    context += `Total Clinics: ${activeCount + inactiveCount} (${activeCount} active, ${inactiveCount} inactive)`;

    return context;

  } catch (error) {
    console.error('Error querying clinics:', error);
    return null;
  }
};

export default queryDatabaseContext;