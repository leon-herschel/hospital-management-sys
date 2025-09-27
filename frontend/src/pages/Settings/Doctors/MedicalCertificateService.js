import { ref, push, set, update, serverTimestamp } from 'firebase/database';
import { database } from '../../../firebase/firebase';

/**
 * Saves a medical certificate to the database
 * @param {Object} certificateData - The certificate data to save
 * @param {Object} patientData - The patient information
 * @param {Object} doctorData - The doctor information
 * @param {string} signatureData - Base64 signature data (optional)
 * @returns {Promise<string>} - Returns the certificate ID
 */
export const saveMedicalCertificate = async (certificateData, patientData, doctorData, signatureData = null) => {
  try {
    // Reference to the patient's medical certificates node
    const patientCertificatesRef = ref(database, `patientMedicalCertificates/${patientData.id}`);
    
    // Generate a new certificate reference
    const newCertificateRef = push(patientCertificatesRef);
    
    // Generate certificate ID (for display purposes)
    const certificateId = `MC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Prepare the certificate data to save
    const certificateToSave = {
      // Certificate Information
      certificateId: certificateId,
      certificateNumber: newCertificateRef.key,
      
      // Patient Information
      patient: {
        id: patientData.id,
        name: patientData.name,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        middleName: patientData.middleName || '',
        age: patientData.age,
        gender: patientData.gender,
        dateOfBirth: patientData.dateOfBirth,
        contactNumber: patientData.contactNumber,
        address: patientData.address
      },
      
      // Doctor Information
      doctor: {
        id: doctorData.id,
        fullName: doctorData.fullName,
        firstName: doctorData.firstName,
        lastName: doctorData.lastName,
        specialty: doctorData.specialty || '',
        department: doctorData.department || '',
        prcId: doctorData.prcId || '',
        contactNumber: doctorData.contactNumber || ''
      },
      
      // Medical Certificate Details
      medicalDetails: {
        diagnosis: certificateData.diagnosis,
        recommendations: certificateData.recommendations || '',
        restDays: certificateData.restDays || '',
        dateFrom: certificateData.dateFrom || '',
        dateTo: certificateData.dateTo || '',
        restrictions: certificateData.restrictions || '',
        followUpDate: certificateData.followUpDate || '',
        remarks: certificateData.remarks || ''
      },
      
      // Certificate Metadata
      metadata: {
        issuedDate: new Date().toISOString(),
        issueLocation: 'Cebu City, Philippines',
        certificateType: 'Medical Certificate',
        status: 'active', // active, revoked, expired
        isSigned: signatureData ? true : false,
        signedDate: signatureData ? new Date().toISOString() : null,
        digitalSignature: signatureData || null
      },
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      
      // Additional tracking
      version: '1.0',
      clinic: {
        name: 'ODYSSEY MANAGEMENT SYSTEM',
        address: '123 Medical Center Drive, Cebu city, Cebu',
        contact: 'Tel: (053) 123-4567 | Email: info@hms.ph'
      }
    };
    
    // Save the certificate to the database
    await set(newCertificateRef, certificateToSave);
    
    console.log('Medical certificate saved successfully:', certificateId);
    return certificateId;
    
  } catch (error) {
    console.error('Error saving medical certificate:', error);
    throw new Error(`Failed to save medical certificate: ${error.message}`);
  }
};

/**
 * Updates a medical certificate's signature
 * @param {string} patientId - The patient ID
 * @param {string} certificateKey - The certificate key in the database
 * @param {string} signatureData - Base64 signature data
 * @returns {Promise<void>}
 */
export const signMedicalCertificate = async (patientId, certificateKey, signatureData) => {
  try {
    const certificateRef = ref(database, `patientMedicalCertificates/${patientId}/${certificateKey}`);
    
    const updateData = {
      'metadata/isSigned': true,
      'metadata/signedDate': new Date().toISOString(),
      'metadata/digitalSignature': signatureData,
      'updatedAt': serverTimestamp()
    };
    
    await set(certificateRef, updateData);
    console.log('Certificate signed successfully');
    
  } catch (error) {
    console.error('Error signing certificate:', error);
    throw new Error(`Failed to sign certificate: ${error.message}`);
  }
};

/**
 * Retrieves all medical certificates for a patient
 * @param {string} patientId - The patient ID
 * @returns {Promise<Object>} - Returns the certificates data
 */
export const getPatientMedicalCertificates = async (patientId) => {
  try {
    const { get } = await import('firebase/database');
    const certificatesRef = ref(database, `patientMedicalCertificates/${patientId}`);
    const snapshot = await get(certificatesRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return {};
    }
  } catch (error) {
    console.error('Error fetching patient certificates:', error);
    throw new Error(`Failed to fetch certificates: ${error.message}`);
  }
};

/**
 * Updates certificate status (e.g., revoke)
 * @param {string} patientId - The patient ID
 * @param {string} certificateKey - The certificate key
 * @param {string} status - New status (active, revoked, expired)
 * @param {string} reason - Reason for status change (optional)
 * @returns {Promise<void>}
 */
export const updateCertificateStatus = async (patientId, certificateKey, status, reason = '') => {
  try {
    const { update } = await import('firebase/database');
    const certificateRef = ref(database, `patientMedicalCertificates/${patientId}/${certificateKey}`);
    
    const updateData = {
      'metadata/status': status,
      'metadata/statusReason': reason,
      'metadata/statusUpdatedDate': new Date().toISOString(),
      'updatedAt': serverTimestamp()
    };
    
    await update(certificateRef, updateData);
    console.log(`Certificate status updated to: ${status}`);
    
  } catch (error) {
    console.error('Error updating certificate status:', error);
    throw new Error(`Failed to update certificate status: ${error.message}`);
  }
};

/**
 * Gets certificate statistics for a doctor
 * @param {string} doctorId - The doctor ID
 * @returns {Promise<Object>} - Returns certificate statistics
 */
export const getDoctorCertificateStats = async (doctorId) => {
  try {
    const { get, query, orderByChild, equalTo } = await import('firebase/database');
    const allCertificatesRef = ref(database, 'patientMedicalCertificates');
    const snapshot = await get(allCertificatesRef);
    
    let stats = {
      total: 0,
      thisMonth: 0,
      thisWeek: 0,
      signed: 0,
      unsigned: 0
    };
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Iterate through all patients' certificates
      Object.values(data).forEach(patientCerts => {
        Object.values(patientCerts).forEach(cert => {
          if (cert.doctor?.id === doctorId) {
            stats.total++;
            
            const certDate = new Date(cert.metadata.issuedDate);
            
            // This month count
            if (certDate.getMonth() === currentMonth && certDate.getFullYear() === currentYear) {
              stats.thisMonth++;
            }
            
            // This week count
            if (certDate >= weekAgo) {
              stats.thisWeek++;
            }
            
            // Signed/unsigned count
            if (cert.metadata.isSigned) {
              stats.signed++;
            } else {
              stats.unsigned++;
            }
          }
        });
      });
    }
    
    return stats;
    
  } catch (error) {
    console.error('Error fetching doctor certificate stats:', error);
    throw new Error(`Failed to fetch certificate stats: ${error.message}`);
  }
};