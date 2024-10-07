import jsPDF from "jspdf";
import QRCode from "qrcode";

export const generatePDF = async(patientInfo) => {
    const doc = new jsPDF();


    doc.text(`First Name: ${patientInfo.firstName}`, 90, 20);
    doc.text(`Last Name: ${patientInfo.lastName}`, 90, 30);
    doc.text(`Birth Date: ${patientInfo.birth}`, 90, 40);
    doc.text(`Age: ${patientInfo.age}`, 90, 50);
    doc.text(`Gender: ${patientInfo.gender}`, 90, 60);

    if (patientInfo.status === "Inpatient") {
        doc.text(`Room Type: ${patientInfo.roomType}`, 90, 70);
    }


    const qrCodeDataUrl = await QRCode.toDataURL(patientInfo.qrData, {
        width: 100,
    });


    doc.addImage(qrCodeDataUrl, "PNG", 10, 0, 80, 80);

    doc.output("dataurlnewwindow");
};