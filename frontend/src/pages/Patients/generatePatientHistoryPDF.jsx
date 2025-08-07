import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generatePatientHistoryPDF = (patient, inventoryItems = [], labTests = [], users = {}, medicalServices = {}) => {
  // Create new PDF document
  const pdf = new jsPDF();
  
  // Helper function to get user name from ID
  const getUserName = (userId, fallbackName) => {
    if (userId && users[userId]) {
      const user = users[userId];
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      return `${firstName} ${lastName}`.trim() || fallbackName || "Unknown User";
    }
    return fallbackName || "Unknown User";
  };

  // Helper function to get test name from serviceId
  const getTestName = (serviceId, fallbackName) => {
    if (medicalServices[serviceId]) {
      return medicalServices[serviceId].name;
    }
    return fallbackName || "Unknown Test";
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  };

  // Add header
  pdf.setFontSize(20);
  pdf.setFont(undefined, 'bold');
  pdf.text('Patient Medical History Report', 20, 20);
  
  // Add generation date
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
  
  // Patient Information Section
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('Patient Information', 20, 45);
  
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  
  const patientInfo = [
    ['First Name:', patient.firstName || 'N/A'],
    ['Last Name:', patient.lastName || 'N/A'],
    ['Gender:', patient.gender || 'N/A'],
    ['Date of Birth:', patient.dateOfBirth || 'N/A'],
    ['Blood Type:', patient.bloodType || 'N/A'],
    ['Contact Number:', patient.contactNumber || 'N/A']
  ];
  
  let yPosition = 55;
  patientInfo.forEach(([label, value]) => {
    pdf.text(label, 20, yPosition);
    pdf.text(value, 80, yPosition);
    yPosition += 8;
  });

  // Item Usage History Section
  yPosition += 10;
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('Item Usage History', 20, yPosition);
  
  if (inventoryItems.length > 0) {
    const itemTableData = inventoryItems.map(item => [
      item.itemName || 'Unknown',
      item.quantity?.toString() || '0',
      `${item.processedByUserFirstName || ''} ${item.processedByUserLastName || ''}`.trim() || 'Unknown',
      formatTimestamp(item.timestamp),
      item.sourceDepartment || 'N/A',
      item.reason || 'N/A'
    ]);

    pdf.autoTable({
      startY: yPosition + 10,
      head: [['Item Name', 'Quantity', 'Processed By', 'Date & Time', 'Department', 'Reason']],
      body: itemTableData,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25 },
        5: { cellWidth: 35 }
      },
      margin: { left: 20, right: 20 }
    });
    
    yPosition = pdf.lastAutoTable.finalY + 20;
  } else {
    yPosition += 15;
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'italic');
    pdf.text('No item usage history found.', 20, yPosition);
    yPosition += 20;
  }

  // Check if we need a new page
  if (yPosition > 250) {
    pdf.addPage();
    yPosition = 20;
  }

  // Laboratory Tests History Section
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('Laboratory Tests History', 20, yPosition);
  
  if (labTests.length > 0) {
    const labTableData = labTests.map(test => [
      getTestName(test.serviceId, test.serviceName),
      test.status || 'N/A',
      test.resultStatus || 'N/A',
      test.sampleStatus || 'N/A',
      getUserName(test.requestedBy, test.requestedByName),
      test.department || 'N/A',
      formatTimestamp(test.createdAt),
      test.urgentFlag ? 'Yes' : 'No',
      test.patientNotes || 'N/A'
    ]);

    pdf.autoTable({
      startY: yPosition + 10,
      head: [['Test Name', 'Status', 'Result Status', 'Sample Status', 'Requested By', 'Department', 'Date Requested', 'Urgent', 'Notes']],
      body: labTableData,
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [40, 167, 69],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
        6: { cellWidth: 30 },
        7: { cellWidth: 15 },
        8: { cellWidth: 25 }
      },
      margin: { left: 20, right: 20 }
    });
  } else {
    yPosition += 15;
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'italic');
    pdf.text('No laboratory test history found.', 20, yPosition);
  }

  // Add footer
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.width - 30, pdf.internal.pageSize.height - 10);
    pdf.text('Confidential Medical Document', 20, pdf.internal.pageSize.height - 10);
  }

  // Generate filename
  const fileName = `Patient_History_${patient.firstName}_${patient.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Save the PDF
  pdf.save(fileName);
};

export default generatePatientHistoryPDF;