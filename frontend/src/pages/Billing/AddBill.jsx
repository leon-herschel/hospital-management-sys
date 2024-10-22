import { useState, useEffect } from "react";
import { database } from "../../firebase/firebase";
import { ref, onValue, update, push, get } from "firebase/database";

const AddBill = ({ onClose }) => {
  const [patientList, setPatientList] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [billingAmount, setBillingAmount] = useState(0);
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [medsUsed, setMedsUsed] = useState([]);
  const [suppliesUsed, setSuppliesUsed] = useState([]);
  const [presentDate, setPresentDate] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // Search term state
  const [showDropdown, setShowDropdown] = useState(false); // Control dropdown visibility

  // Fetch patient list on component mount
  useEffect(() => {
    const patientRef = ref(database, "patient");
    const unsubscribePatientRef = onValue(
      patientRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const patientData = Object.keys(data).map((key) => ({
            ...data[key],
            id: key,
            fullName: `${data[key].firstName || ""} ${
              data[key].lastName || ""
            }`,
          }));
          setPatientList(patientData);
        }
      },
      (error) => {
        console.error("Error fetching patients: ", error);
      }
    );

    return () => unsubscribePatientRef(); // Cleanup listener
  }, []);

  // Function for setting the current date in Hong Kong timezone
  useEffect(() => {
    const today = new Date();

    // Convert to Hong Kong timezone and format as YYYY-MM-DD
    const formattedDate = today.toLocaleString("en-US", {
      timeZone: "Asia/Hong_Kong",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    // Convert to YYYY-MM-DD format
    const [month, day, year] = formattedDate.split("/");
    const hkFormattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}`;

    setPresentDate(hkFormattedDate);
  }, []);

  // Fetch medUse and suppliesUsed when a patient is selected
  useEffect(() => {
    const fetchBillingItems = async () => {
      if (!selectedPatient) return;

      const patientRef = ref(database, `patient/${selectedPatient}`);
      try {
        const snapshot = await get(patientRef);
        let totalAmount = 0;
        let meds = [];
        let supplies = [];

        if (snapshot.exists()) {
          const data = snapshot.val();
          setSelectedPatientName(
            `${data.firstName || ""} ${data.lastName || ""}`
          );

          // Calculate total from medUse
          if (data.medUse && typeof data.medUse === "object") {
            Object.keys(data.medUse).forEach((key) => {
              const medicine = data.medUse[key];
              const quantity = medicine.quantity || 0;
              const retailPrice = medicine.retailPrice || 0;
              totalAmount += quantity * retailPrice;

              meds.push({
                id: push(ref(database, "temp")).key, // Use a temporary ref to generate a unique key
                name: medicine.name || "Unknown Medicine",
                quantity,
                retailPrice,
              });
            });
          }

          // Calculate total from suppliesUsed
          if (data.suppliesUsed && typeof data.suppliesUsed === "object") {
            Object.keys(data.suppliesUsed).forEach((key) => {
              const supply = data.suppliesUsed[key];
              const quantity = supply.quantity || 0;
              const retailPrice = supply.retailPrice || 0;
              totalAmount += quantity * retailPrice;

              supplies.push({
                id: push(ref(database, "temp")).key, // Use a temporary ref to generate a unique key
                name: supply.name || "Unknown Supply",
                quantity,
                retailPrice,
              });
            });
          }

          // Set the total billing amount and items used
          setBillingAmount(totalAmount);
          console.log("Total Billing Amount:", totalAmount);
          setMedsUsed(meds);
          setSuppliesUsed(supplies);
        } else {
          console.error("No data found for the selected patient");
        }
      } catch (error) {
        console.error("Error fetching billing items: ", error);
      }
    };

    fetchBillingItems();
  }, [selectedPatient]);

  // Handle input change for search term
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true); // Show dropdown when typing
  };

  // Handle selecting a patient from the dropdown
  const handlePatientSelect = (patient) => {
    setSearchTerm(patient.fullName); // Update the input with the selected patient's name
    setSelectedPatient(patient.id); // Store the selected patient's ID
    setShowDropdown(false); // Hide the dropdown
  };

  // Submit the bill for the selected patient
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      alert("Please select a patient.");
      return;
    }

    const billingRef = push(ref(database, "billing"));

    const billingData = {
      amount: billingAmount,
      status: "Unpaid",
      patientName: selectedPatientName,
      medsUsed: medsUsed.map((med) => ({
        id: med.id, // Unique key
        name: med.name,
        quantity: med.quantity,
        retailPrice: med.retailPrice,
      })),
      suppliesUsed: suppliesUsed.map((supply) => ({
        id: supply.id, // Unique key
        name: supply.name,
        quantity: supply.quantity,
        retailPrice: supply.retailPrice,
      })),
      dateAdded: presentDate,
    };

    // Update billing data in Firebase
    await update(billingRef, billingData);

    alert(
      `Bill of ₱${billingAmount.toFixed(
        2
      )} with status "Unpaid" added for patient: ${selectedPatientName}`
    );

    // Close modal after successful submission
    onClose();
  };

  // Filter patient list based on search term
  const filteredPatients = patientList.filter((patient) =>
    patient.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add New Billing</h2>
      <form onSubmit={handleSubmit}>
        {/* Search and select patient */}
        <div className="mt-4 relative">
          <label htmlFor="searchTerm" className="block text-gray-700 mb-2">
            Patient
          </label>
          <input
            type="text"
            id="searchTerm"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search a patient"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            onFocus={() => setShowDropdown(true)} // Show dropdown on focus
          />
          {/* Dropdown to show filtered patients */}
          {showDropdown && searchTerm && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md max-h-48 overflow-y-auto">
              {filteredPatients.map((patient) => (
                <li
                  key={patient.id}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handlePatientSelect(patient)}
                >
                  {patient.fullName}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="billingAmount" className="block text-gray-700 mb-2">
            Total Billing Amount
          </label>
          <input
            type="text"
            id="billingAmount"
            value={`₱${billingAmount ? billingAmount.toFixed(2) : "0.00"}`}
            readOnly
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="dateAdded" className="block text-gray-700 mb-2">
            Date Added
          </label>
          <input
            type="text"
            id="dateAdded"
            value={presentDate}
            readOnly
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className="mr-2 bg-slate-300 text-gray-700 px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Add Billing
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBill;
