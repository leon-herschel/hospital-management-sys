import React from 'react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { QrCode } from 'lucide-react';

const PatientQRGenerator = ({ patient, patientId }) => {
  const generatePatientQRCode = async () => {
    if (!patient) {
      alert('Patient data not available');
      return;
    }

    try {
      // Create the QR code data string
      const qrData = JSON.stringify({
        id: patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        bloodType: patient.bloodType || 'Unknown',
        dob: patient.dateOfBirth || '',
        gender: patient.gender || '',
        emergencyContact: patient.emergencyContactNumber || ''
      });

      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Patient Wristband QR Code', 105, 20, { align: 'center' });

      // Patient Information
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      
      const startY = 40;
      const lineHeight = 8;
      let currentY = startY;

      pdf.text(`Patient ID: ${patientId}`, 20, currentY);
      currentY += lineHeight;
      
      pdf.text(`Name: ${patient.firstName} ${patient.lastName}`, 20, currentY);
      currentY += lineHeight;
      
      pdf.text(`Blood Type: ${patient.bloodType || 'Unknown'}`, 20, currentY);
      currentY += lineHeight;
      
      if (patient.dateOfBirth) {
        pdf.text(`Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}`, 20, currentY);
        currentY += lineHeight;
      }
      
      if (patient.gender) {
        pdf.text(`Gender: ${patient.gender}`, 20, currentY);
        currentY += lineHeight;
      }

      if (patient.emergencyContactNumber) {
        pdf.text(`Emergency Contact: ${patient.emergencyContactNumber}`, 20, currentY);
        currentY += lineHeight;
      }

      // Add QR Code
      const qrX = 105 - 30; // Center the QR code (30mm is half of 60mm width)
      const qrY = currentY + 10;
      pdf.addImage(qrCodeDataURL, 'PNG', qrX, qrY, 60, 60);

      // Instructions
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Scan this QR code to access patient information', 105, qrY + 70, { align: 'center' });

      // Add multiple copies for wristband printing (2x2 grid)
      const copies = 4;
      const copiesPerRow = 2;
      const copyWidth = 90;
      const copyHeight = 120;
      const startX = 15;
      const startYCopies = 180;

      pdf.addPage();
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Wristband Copies (Cut Along Lines)', 105, 15, { align: 'center' });

      for (let i = 0; i < copies; i++) {
        const row = Math.floor(i / copiesPerRow);
        const col = i % copiesPerRow;
        const x = startX + (col * copyWidth);
        const y = startYCopies + (row * copyHeight);

        // Draw border for cutting
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.rect(x, y, copyWidth - 5, copyHeight - 20);

        // Patient name (larger text for wristband)
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${patient.firstName}`, x + 5, y + 10);
        pdf.text(`${patient.lastName}`, x + 5, y + 18);

        // Blood type (prominent)
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 0, 0); // Red color for blood type
        pdf.text(`${patient.bloodType || 'Unknown'}`, x + 5, y + 30);
        pdf.setTextColor(0, 0, 0); // Reset to black

        // ID
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`ID: ${patientId}`, x + 5, y + 38);

        // QR Code (smaller for wristband)
        const smallQrSize = 25;
        pdf.addImage(qrCodeDataURL, 'PNG', x + copyWidth - 35, y + 5, smallQrSize, smallQrSize);
      }

      // Save the PDF
      const fileName = `${patient.firstName}_${patient.lastName}_QR_Wristband.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating QR code PDF:', error);
      alert('Error generating QR code PDF. Please try again.');
    }
  };

  return (
    <button
      onClick={generatePatientQRCode}
      className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
    >
      <QrCode className="w-4 h-4" />
      <span>Generate QR Code</span>
    </button>
  );
};

export default PatientQRGenerator;