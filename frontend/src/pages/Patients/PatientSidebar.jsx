import React from "react";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Droplet,
  AlertTriangle,
  Users,
} from "lucide-react";
import QRCode from "react-qr-code";

function PatientSidebar({ patient, id }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{patient.firstName} {patient.lastName}</h2>
            <div className="flex justify-end">
              <QRCode
                value={id}
                size={45}
                bgColor="#ffffff"
                fgColor="#000000"
                className="mt-4 mr-15"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Droplet className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-sm text-gray-600">Blood Type</p>
            <p className="font-semibold">{patient.bloodType || "Not specified"}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <User className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-600">Gender</p>
            <p className="font-semibold">{patient.gender}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-600">Date of Birth</p>
            <p className="font-semibold">{patient.dateOfBirth}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Phone className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-600">Contact</p>
            <p className="font-semibold">{patient.contactNumber}</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">Address</p>
            <p className="font-semibold">{patient.address || "Not provided"}</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">Allergies</p>
            <p className="font-semibold">{patient.allergies || "None recorded"}</p>
          </div>
        </div>
        
        {patient.emergencyContact && (
          <div className="flex items-start space-x-3">
            <Users className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Emergency Contact</p>
              <p className="font-semibold">{patient.emergencyContact.name}</p>
              <p className="text-sm text-gray-600">{patient.emergencyContact.phone}</p>
              <p className="text-sm text-gray-600">{patient.emergencyContact.relationship}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientSidebar;