import QRCode from "react-qr-code";

function QrGenerator() {
  return (
    <div>
      <QRCode size={200} bgColor="white" fgColor="black" value="qr" />
    </div>
  );
}

export default QrGenerator;
