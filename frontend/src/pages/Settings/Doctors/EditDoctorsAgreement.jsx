// src/components/Admin/EditDoctorsAgreement.jsx
import { useState, useEffect } from "react";
import { ref, get, set } from "firebase/database";
import { database } from "../../../firebase/firebase";

const EditDoctorsAgreement = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchAgreement = async () => {
      const snap = await get(ref(database, "agreement/doctors"));
      if (snap.exists()) {
        const data = snap.val();
        setTitle(data.title || "");
        setContent(data.content || "");
      }
    };
    fetchAgreement();
  }, []);

  const handleSave = async () => {
    try {
      await set(ref(database, "agreement/doctors"), {
        title,
        content,
        lastUpdated: new Date().toISOString(),
      });
      setStatus("Agreement updated successfully!");
    } catch (err) {
      console.error(err);
      setStatus("Error updating agreement.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-md shadow-md">
      <h2 className="text-2xl font-bold mb-4">Edit Doctor's Agreement</h2>
      <label className="block mb-2">Title</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 rounded-md mb-4"
      />
      <label className="block mb-2">Content</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full border p-2 rounded-md mb-4 h-64"
      />
      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Save
      </button>
      {status && <p className="mt-4">{status}</p>}
    </div>
  );
};

export default EditDoctorsAgreement;
