import React, { useEffect, useState } from "react";
import { ref, onValue, remove } from "firebase/database";
import { database } from "../../../firebase/firebase";
import { Truck, Search, Plus, Edit, Trash2, Phone, Mail, MapPin, User } from 'lucide-react';
import AddSupplierModal from "./AddSupplierModal";
import EditSupplierModal from "./EditSupplierModal";

const SuppliersTable = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const supplierRef = ref(database, "suppliers");
    const unsubscribe = onValue(supplierRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formatted = Object.entries(data).map(([id, val]) => ({
          id,
          ...val,
        }));
        setSuppliers(formatted);
        setFilteredSuppliers(formatted);
      } else {
        setSuppliers([]);
        setFilteredSuppliers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered = suppliers.filter(supplier => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (supplier?.name || '').toLowerCase().includes(searchLower) ||
        (supplier?.contactPerson || '').toLowerCase().includes(searchLower) ||
        (supplier?.phone || '').toLowerCase().includes(searchLower) ||
        (supplier?.email || '').toLowerCase().includes(searchLower) ||
        (supplier?.address || '').toLowerCase().includes(searchLower)
      );
    });
    setFilteredSuppliers(filtered);
  }, [searchTerm, suppliers]);

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setShowEditModal(true);
  };

  const confirmDeleteSupplier = (supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteConfirm(true);
  };

  const handleDeleteSupplier = async () => {
    if (supplierToDelete) {
      try {
        await remove(ref(database, `suppliers/${supplierToDelete.id}`));
        setSupplierToDelete(null);
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const getSupplierStats = () => {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(supplier => supplier.status !== 'inactive').length;
    const localSuppliers = suppliers.filter(supplier => 
      (supplier.address || '').toLowerCase().includes('local') || 
      (supplier.address || '').toLowerCase().includes('city')
    ).length;
    
    return {
      total: totalSuppliers,
      active: activeSuppliers,
      local: localSuppliers
    };
  };

  const stats = getSupplierStats();

  return (
    <div className="w-full bg-white rounded-lg shadow-md">
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Truck size={24} />
              <span>Suppliers Management</span>
            </h2>
            <p className="text-gray-600 mt-1">Manage supplier information and contacts</p>
          </div>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md flex items-center space-x-2 transition-colors"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={20} />
            <span>Add Supplier</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <h3 className="text-sm font-semibold text-blue-800">Total Suppliers</h3>
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            <p className="text-xs text-blue-600">Registered suppliers</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
            <h3 className="text-sm font-semibold text-green-800">Active Suppliers</h3>
            <p className="text-2xl font-bold text-green-900">{stats.active}</p>
            <p className="text-xs text-green-600">Currently active</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
            <h3 className="text-sm font-semibold text-orange-800">Local Suppliers</h3>
            <p className="text-2xl font-bold text-orange-900">{stats.local}</p>
            <p className="text-xs text-orange-600">Local partners</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="relative overflow-x-auto rounded-md shadow-sm">
          <table className="w-full text-sm text-gray-900 text-center border border-gray-200">
            <thead className="text-sm bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3">Contact Person</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-100">
                          <Truck size={20} className="text-orange-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {supplier.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {supplier.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-1">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm">{supplier.contactPerson}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-1">
                        <Phone size={14} className="text-gray-400" />
                        <span className="text-sm">{supplier.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-1">
                        <Mail size={14} className="text-gray-400" />
                        <span className="text-sm">{supplier.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-1">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-sm max-w-xs truncate" title={supplier.address}>
                          {supplier.address}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="px-3 py-1 rounded-md text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDeleteSupplier(supplier)}
                          className="px-3 py-1 rounded-md text-xs bg-red-600 hover:bg-red-700 text-white transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <Truck size={32} className="text-gray-300" />
                      <span>No suppliers found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddSupplierModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      <EditSupplierModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        supplier={selectedSupplier}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Truck size={24} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-900">Delete Supplier</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{supplierToDelete?.name}</span>?
                This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleDeleteSupplier}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersTable;