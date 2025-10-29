import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../../firebase/firebase";
import { Stethoscope, FlaskConical, Loader2 } from "lucide-react";
import AddMedicalServices from "./AddMedicalServicesModal";
import EditMedicalServiceModal from "./EditMedicalServiceModal";
import DeleteMedicalServiceModal from "./DeleteMedicalServiceModal";

export default function MedicalServicesList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
  };

  useEffect(() => {
    const serviceRef = ref(database, "medicalServices");
    const unsubscribe = onValue(serviceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const fetched = [];

        Object.keys(data).forEach((categoryKey) => {
          const category = data[categoryKey];
          Object.keys(category).forEach((serviceKey) => {
            fetched.push({
              id: serviceKey,
              category: categoryKey,
              name: category[serviceKey].name,
              description: category[serviceKey].description,
            });
          });
        });

        setServices(fetched);
      } else {
        setServices([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                  <Stethoscope className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Medical Services Management
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage and track medical services offered
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => openModal("AddMedicalService")}
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Medical Service
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <table className="w-full border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xl mt-6">
          <thead className="bg-gradient-to-r from-blue-500 to-purple-600">
            <tr>
              <th className="py-4 px-6 text-left text-white font-semibold text-sm uppercase tracking-wide">
                Category
              </th>
              <th className="py-4 px-6 text-left text-white font-semibold text-sm uppercase tracking-wide">
                Name
              </th>
              <th className="py-4 px-6 text-left text-white font-semibold text-sm uppercase tracking-wide">
                Description
              </th>
              <th className="py-4 px-6 text-left text-white font-semibold text-sm uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr
                key={service.id}
                className="border-t border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all"
              >
                <td className="py-4 px-6 flex items-center gap-3 text-gray-800 font-medium">
                  {service.category === "consultationTypes" ? (
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-md">
                      <Stethoscope className="text-white" size={20} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl shadow-md">
                      <FlaskConical className="text-white" size={20} />
                    </div>
                  )}
                  <span className="text-gray-700">
                    {service.category === "consultationTypes"
                      ? "Consultation"
                      : "Laboratory"}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-800 font-medium">
                  {service.name}
                </td>
                <td className="py-4 px-6 text-gray-600">
                  {service.description}
                </td>
                <td className="py-4 px-6 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedService(service);
                      openModal("EditMedicalService");
                    }}
                    className="text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedService(service);
                      openModal("DeleteMedicalService");
                    }}
                    className="text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddMedicalServices
        open={modalOpen && modalType === "AddMedicalService"}
        onClose={closeModal}
      />
      <EditMedicalServiceModal
        open={modalOpen && modalType === "EditMedicalService"}
        onClose={closeModal}
        service={selectedService}
      />
      <DeleteMedicalServiceModal
        open={modalOpen && modalType === "DeleteMedicalService"}
        onClose={closeModal}
        service={selectedService}
      />
    </div>
  );
}
