import React, { useState } from "react";
import { ref, push, set } from "firebase/database";
import QRCode from "qrcode";
import { database } from "../../firebase/firebase";
import MedicineBulkUpload from "./MedicineBuldUpload"

// Helper function to generate a random alphanumeric string
const generateRandomKey = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Function to calculate status based on quantity and maxQuantity
{/*const calculateStatus = (quantity, maxQuantity) => {
  const percentage = (quantity / maxQuantity) * 100;

  if (percentage > 70) {
    return "Good";
  } else if (percentage > 50) {
    return "Low";
  } else {
    return "Very Low";
  }
}; */}

function AddInventory({ isOpen, toggleModal }) {
  const [shortDesc, setShortDesc] = useState("");
  const [standardDesc, setStandardDesc] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [genericName, setGenericName] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [itemGroup, setItemGroup] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [examinationType, setExaminationType] = useState("");
  const [nhipCategory, setNhipCategory] = useState("");
  const [drugAdminGroup, setDrugAdminGroup] = useState("");
  const [smallUnit, setSmallUnit] = useState("");
  const [conversion, setConversion] = useState("");
  const [bigUnit, setBigUnit] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  const [shortDescError, setShortDescError] = useState(false);
  const [standardDescError, setStandardDescError] = useState(false);
  const [customDescError, setCustomDescError] = useState(false);
  const [genericNameError, setGenericNameError] = useState(false);
  const [specificationsError, setSpecificationsError] = useState(false);
  const [itemGroupError, setItemGroupError] = useState(false);
  const [itemCategoryError, setItemCategoryError] = useState(false);
  const [examinationTypeError, setExaminationTypeError] = useState(false);
  const [nhipCategoryError, setNhipCategoryError] = useState(false);
  const [drugAdminGroupError, setDrugAdminGroupError] = useState(false);
  const [smallUnitError, setSmallUnitError] = useState(false);
  const [conversionError, setConversionError] = useState(false);
  const [bigUnitError, setBigUnitError] = useState(false);
  const [expiryDateError, setExpiryDateError] = useState(false);
  const [quantityError, setQuantityError] = useState(false);

  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

const toggleCSVModal = () => {
  setIsCSVModalOpen(!isCSVModalOpen);
};
  const handlesubmit = async () => {
    // Reset errors
    setShortDescError(!shortDesc);
    setStandardDescError(!standardDesc);
    setCustomDescError(!customDesc);
    setGenericNameError(!genericName);
    setSpecificationsError(!specifications);
    setItemGroupError(!itemGroup);
    setItemCategoryError(!itemCategory);
    setExaminationTypeError(!examinationType);
    setNhipCategoryError(!nhipCategory);
    setDrugAdminGroupError(!drugAdminGroup);
    setSmallUnitError(!smallUnit);
    setConversionError(!conversion);
    setBigUnitError(!bigUnit);
    setExpiryDateError(!expiryDate);
    setQuantityError(!quantity);

    if (
      !shortDesc ||
      !standardDesc ||
      !customDesc ||
      !genericName ||
      !specifications ||
      !itemGroup ||
      !itemCategory ||
      !examinationType ||
      !nhipCategory ||
      !drugAdminGroup ||
      !smallUnit ||
      !conversion ||
      !bigUnit ||
      !expiryDate ||
      !quantity
    ) {
      return;
    }

    const inventoryRef = ref(database, "departments/Pharmacy/localMeds");
    const newInventoryRef = push(inventoryRef);

    const qrKey = generateRandomKey(20);
    {/*const maxQuantity = Number(conversion); // Assuming conversion as quantity
    const status = calculateStatus(maxQuantity, maxQuantity);*/}

    try {
      setLoading(true);
      const qrCodeDataUrl = await QRCode.toDataURL(qrKey, { width: 100 });

      const inventoryData = {
        shortDesc,
        standardDesc,
        customDesc,
        genericName,
        specifications,
        itemGroup,
        itemCategory,
        examinationType,
        nhipCategory,
        drugAdminGroup,
        smallUnit,
        conversion,
        bigUnit,
        expiryDate,
        //maxQuantity,
        quantity,
        qrCode: qrCodeDataUrl,
      };

      await set(newInventoryRef, inventoryData);
      alert("Inventory has been added successfully!");

      // Clear form fields
      setShortDesc("");
      setStandardDesc("");
      setCustomDesc("");
      setGenericName("");
      setSpecifications("");
      setItemGroup("");
      setItemCategory("");
      setExaminationType("");
      setNhipCategory("");
      setDrugAdminGroup("");
      setSmallUnit("");
      setConversion("");
      setBigUnit("");
      setExpiryDate("");
      setQuantity("");
      toggleModal();
    } catch (error) {
      alert("Error adding inventory: " + error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
          onClick={toggleModal}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">Add New Medicine</h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Column 1 */}
          <div>
            <div className="mb-4">
              <label htmlFor="shortDesc" className="block text-gray-700 mb-1">
                Short Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="shortDesc"
                name="shortDesc"
                className={`w-full px-3 py-2 border rounded-lg ${
                  shortDescError ? "border-red-500" : "border-gray-300"
                }`}
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                disabled={loading}
              />
              {shortDescError && <p className="text-red-500 mt-1">Required</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="standardDesc" className="block text-gray-700 mb-1">
                Standard Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="standardDesc"
                name="standardDesc"
                className={`w-full px-3 py-2 border rounded-lg ${
                  standardDescError ? "border-red-500" : "border-gray-300"
                }`}
                value={standardDesc}
                onChange={(e) => setStandardDesc(e.target.value)}
                disabled={loading}
              />
              {standardDescError && <p className="text-red-500 mt-1">Required</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="customDesc" className="block text-gray-700 mb-1">
                Custom Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="customDesc"
                name="customDesc"
                className={`w-full px-3 py-2 border rounded-lg ${
                  customDescError ? "border-red-500" : "border-gray-300"
                }`}
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                disabled={loading}
              />
              {customDescError && <p className="text-red-500 mt-1">Required</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="genericName" className="block text-gray-700 mb-1">
                Generic Name <span className="text-red-500">*</span>
              </label>
              <input
              type="text"
              id="genericName"
              name="genericName"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                genericNameError ? "border-red-500" : "border-gray-300"
              }`}
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
            disabled={loading} // Disable input when submitting
            >
              </input>
              {genericNameError && <p className="text-red-500 mt-1">Required</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="specifications" className="block text-gray-700 mb-1">
                Specifications <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="specifications"
                name="specifications"
                className={`w-full px-3 py-2 border rounded-lg ${
                  specificationsError ? "border-red-500" : "border-gray-300"
                }`}
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                disabled={loading}
              />
              {specificationsError && <p className="text-red-500 mt-1">Required</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="itemGroup" className="block text-gray-700 mb-1">
                Item Group <span className="text-red-500">*</span>
              </label>
              <select
              id="itemGroup"
              name="itemGroup"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                itemGroupError ? "border-red-500" : "border-gray-300"
              }`}
              value={itemGroup}
              onChange={(e) => setItemGroup(e.target.value)}
            disabled={loading} // Disable input when submitting
            >
                <option value="" disabled>Select Item Group</option>
                <option value="Drugs and Medicines">Drugs and Medicines</option>
                <option value="Examinations">Examinations</option>
                <option value="Procedures">Procedures</option>
                <option value="Assets Equipment">Assets Equipment</option>
                <option value="Miscellaneous/Others">Miscellaneous/Others</option>
              </select>
              {itemGroupError && <p className="text-red-500 mt-1">Required</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="itemCategory" className="block text-gray-700 mb-1">
                Item Category <span className="text-red-500">*</span>
              </label>  
              <select
              id="itemCategory"
              name="itemCategory"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                itemCategoryError ? "border-red-500" : "border-gray-300"
              }`}
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value)}
            disabled={loading} // Disable input when submitting
            >
                  <option value="" disabled>Select Item Category</option>
                  <option value="Nebules and Sprays">Nebules and Sprays</option>
                  <option value="Tablets and Capsules">Tablets and Capsules</option>
                  <option value="Syrup, Suspension and Drops">Syrup, Suspension and Drops</option>
                  <option value="Creams and Ointments">Creams and Ointments</option>
                  <option value="Ampoules and Vials">Ampoules and Vials</option>
                  <option value="Eye and Ear Preparation">Eye and Ear Preparation</option>
                  <option value="I.V Fluids">I.V Fluids</option>
                  <option value="Suppositories">I.V Fluids</option>
                  <option value="Oxygen">Oxygen</option>
              </select>
              {itemCategoryError && <p className="text-red-500 mt-1">Required</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="quantity" className="block text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                className={`w-full px-3 py-2 border rounded-lg ${
                  quantityError ? "border-red-500" : "border-gray-300"
                }`}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={loading}
              />
              {quantityError && <p className="text-red-500 mt-1">Required</p>}
            </div>
          </div>

          {/* Column 2 */}
          <div>
            

            <div className="mb-4">
              <label htmlFor="examinationType" className="block text-gray-700 mb-1">
                Examination Type <span className="text-red-500">*</span>
              </label>
              <select
              id="examinationType"
              name="examinationType"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                examinationTypeError ? "border-red-500" : "border-gray-300"
              }`}
              value={examinationType}
              onChange={(e) => setExaminationType(e.target.value)}
            disabled={loading} // Disable input when submitting
            >
                <option value="" disabled>Select Examination Type</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {examinationTypeError && <p className="text-red-500 mt-1">Required</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="nhipCategory" className="block text-gray-700 mb-1">
                NHIP Category <span className="text-red-500">*</span>
              </label>
              <select
              id="nhipCategory"
              name="nhipCategory"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                nhipCategoryError ? "border-red-500" : "border-gray-300"
              }`}
              value={nhipCategory}
              onChange={(e) => setNhipCategory(e.target.value)}
            disabled={loading} // Disable input when submitting
            >
                <option value="" disabled>Select NHIP Category</option>
                <option value="Medicines">Medicines</option>
                <option value="Medical Supplies">Medical Supplies</option>
                <option value="Operating Room Fee">Operating Room Fee</option>
                <option value="Laboratory Examination">Laboratory Examination</option>
                <option value="X-Ray Examination">X-Ray Examination</option>
                <option value="Other Fees">Other Fees</option>
                <option value="X-Ray/Laboratory/Others">X-Ray/Laboratory/Others</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
              {nhipCategoryError && <p className="text-red-500 mt-1">Required</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="drugAdminGroup" className="block text-gray-700 mb-1">
                Drug Admin Group <span className="text-red-500">*</span>
              </label>
              <select
              id="drugAdminGroup"
              name="drugAdminGroup"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                drugAdminGroupError ? "border-red-500" : "border-gray-300"
              }`}
              value={drugAdminGroup}
              onChange={(e) => setDrugAdminGroup(e.target.value)}
            disabled={loading} // Disable input when submitting
            >
                <option value="" disabled>Select Drug Admin Group</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {drugAdminGroupError && <p className="text-red-500 mt-1">Required</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="smallUnit" className="block text-gray-700 mb-1">
                Small Unit <span className="text-red-500">*</span>
              </label>
              <select
              id="smallUnit"
              name="smallUnit"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                smallUnitError ? "border-red-500" : "border-gray-300"
              }`}
              value={smallUnit}
              onChange={(e) => setSmallUnit(e.target.value)}
            disabled={loading} // Disable input when submitting
            >
                <option value="" disabled>Select  Small Unit</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {smallUnitError && <p className="text-red-500 mt-1">Required</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="conversion" className="block text-gray-700 mb-1">
                Conversion <span className="text-red-500">*</span>
              </label>
              <select
              id="conversion"
              name="converision"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                conversionError ? "border-red-500" : "border-gray-300"
              }`}
              value={conversion}
              onChange={(e) => setConversion(e.target.value)}
            disabled={loading} // Disable input when submitting
            >
                <option value="" disabled>Select  Conversion</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {conversionError && <p className="text-red-500 mt-1">Required</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="bigUnit" className="block text-gray-700 mb-1">
                Big Unit <span className="text-red-500">*</span>
              </label>
              <select
              id="bigUnit"
              name="bigUnit"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${
                bigUnitError ? "border-red-500" : "border-gray-300"
              }`}
              value={bigUnit}
              onChange={(e) => setBigUnit(e.target.value)}
            disabled={loading} // Disable input when submitting
            >
                <option value="" disabled>Select Big Unit</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {bigUnitError && <p className="text-red-500 mt-1">Required</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="expiryDate" className="block text-gray-700 mb-1">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                className={`w-full px-3 py-2 border rounded-lg ${
                  expiryDateError ? "border-red-500" : "border-gray-300"
                }`}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                disabled={loading}
              />
              {expiryDateError && <p className="text-red-500 mt-1">Required</p>}
            </div>
          </div>
        </div>
        
        

        <div className="flex justify-end mt-6">
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
            onClick={handlesubmit}
            disabled={loading}
          >
            {loading ? "Loading..." : "Submit"}
          </button>
          <button
  onClick={toggleCSVModal}
  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition mb-4"
>
  Upload Bulk (CSV)
</button><MedicineBulkUpload isOpen={isCSVModalOpen} toggleModal={toggleCSVModal} />
        </div>
      </div>
    </div>
  );
}

export default AddInventory;
