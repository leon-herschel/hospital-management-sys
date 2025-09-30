import React, { useState, useRef, useEffect } from 'react';
import {
  PhotoIcon,
  TrashIcon,
  EyeIcon,
  ArrowUpTrayIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/authContext/authContext';
import { ref, onValue, set, remove } from 'firebase/database';
import { database } from '../../../firebase/firebase';

const ImportDoctorSignature = () => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef();
  const canvasRef = useRef();
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [activeSignature, setActiveSignature] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  // Fetch current doctor from Firebase
  useEffect(() => {
    if (currentUser) {
      const doctorsRef = ref(database, "doctors");

      const unsubscribe = onValue(doctorsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          const doctorEntry = Object.entries(data).find(([key, doctor]) => {
            return doctor.email === currentUser.email || 
                   doctor.userId === currentUser.uid ||
                   key === currentUser.uid;
          });

          if (doctorEntry) {
            const [doctorId, doctorData] = doctorEntry;
            setCurrentDoctor({
              id: doctorId,
              ...doctorData
            });
          }
        }
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  // Fetch doctor signatures
  useEffect(() => {
    if (currentDoctor?.id) {
      const signaturesRef = ref(database, `doctorSignatures/${currentDoctor.id}`);
      
      const unsubscribe = onValue(signaturesRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const signaturesArray = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value
          }));
          setSignatures(signaturesArray);
          
          // Set active signature if there's one marked as active
          const active = signaturesArray.find(sig => sig.isActive);
          setActiveSignature(active || null);
        } else {
          setSignatures([]);
          setActiveSignature(null);
        }
      });

      return () => unsubscribe();
    }
  }, [currentDoctor]);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Please upload an image file.');
      return;
    }

    // Validate file size (max 1MB for base64 storage)
    if (file.size > 1 * 1024 * 1024) {
      showNotification('error', 'File size must be less than 1MB.');
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Create unique ID
      const timestamp = Date.now();
      
      // Save signature data to Realtime Database
      const signatureData = {
        id: timestamp.toString(),
        base64Data: base64String,
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        type: 'uploaded',
        fileSize: file.size,
        mimeType: file.type,
        isActive: signatures.length === 0 // Make first signature active by default
      };

      const signatureRef = ref(database, `doctorSignatures/${currentDoctor.id}/${timestamp}`);
      await set(signatureRef, signatureData);

      showNotification('success', 'Signature uploaded successfully!');
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error uploading signature:', error);
      showNotification('error', 'Failed to upload signature. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetActive = async (signatureId) => {
    try {
      // First, set all signatures to inactive
      const updates = {};
      signatures.forEach(sig => {
        updates[`doctorSignatures/${currentDoctor.id}/${sig.id}/isActive`] = false;
      });

      // Set the selected signature as active
      updates[`doctorSignatures/${currentDoctor.id}/${signatureId}/isActive`] = true;

      // Apply all updates
      await Promise.all(
        Object.entries(updates).map(([path, value]) => 
          set(ref(database, path), value)
        )
      );

      showNotification('success', 'Active signature updated successfully!');
    } catch (error) {
      console.error('Error setting active signature:', error);
      showNotification('error', 'Failed to update active signature.');
    }
  };

  const handleDeleteSignature = async (signature) => {
    try {
      // Delete from Database only (no storage cleanup needed)
      const signatureRef = ref(database, `doctorSignatures/${currentDoctor.id}/${signature.id}`);
      await remove(signatureRef);

      showNotification('success', 'Signature deleted successfully!');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting signature:', error);
      showNotification('error', 'Failed to delete signature.');
    }
  };

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    
    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e) => {
    if (!showDrawingCanvas) return;
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || !showDrawingCanvas) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawnSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsUploading(true);

    try {
      // Convert canvas to base64
      const base64String = canvas.toDataURL('image/png');
      
      // Create unique ID
      const timestamp = Date.now();
      const filename = `drawn_signature_${timestamp}.png`;
      
      // Calculate approximate file size (base64 is about 1.33x larger than binary)
      const approximateSize = Math.round((base64String.length * 0.75));

      // Save signature data to Realtime Database
      const signatureData = {
        id: timestamp.toString(),
        base64Data: base64String,
        filename: filename,
        uploadedAt: new Date().toISOString(),
        type: 'drawn',
        fileSize: approximateSize,
        mimeType: 'image/png',
        isActive: signatures.length === 0
      };

      const signatureRef = ref(database, `doctorSignatures/${currentDoctor.id}/${timestamp}`);
      await set(signatureRef, signatureData);

      showNotification('success', 'Drawn signature saved successfully!');
      setShowDrawingCanvas(false);
      clearCanvas();

    } catch (error) {
      console.error('Error saving drawn signature:', error);
      showNotification('error', 'Failed to save drawn signature.');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (showDrawingCanvas) {
      setTimeout(initializeCanvas, 100);
    }
  }, [showDrawingCanvas]);

  if (!currentDoctor) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-700">Please ensure you are logged in as a doctor to manage signatures.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' :
          notification.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
          'bg-blue-100 text-blue-700 border border-blue-200'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckIcon className="w-5 h-5 mr-2" />
            ) : notification.type === 'error' ? (
              <XMarkIcon className="w-5 h-5 mr-2" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
          <div className="flex items-center space-x-3">
            <PencilIcon className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Doctor Signature Management</h1>
              <p className="text-indigo-100">Upload or draw your signature for medical certificates</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Doctor Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Doctor Information</h3>
            <p className="text-gray-600">Dr. {currentDoctor.fullName || `${currentDoctor.firstName} ${currentDoctor.lastName}`}</p>
            <p className="text-sm text-gray-500">PRC License: {currentDoctor.prcId || 'Not specified'}</p>
            <p className="text-sm text-gray-500">Department: {currentDoctor.department || 'General Practice'}</p>
          </div>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* Upload Signature */}
            <div className="bg-blue-50 rounded-lg p-6 border-2 border-dashed border-blue-200">
              <div className="text-center">
                <PhotoIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Signature</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Upload a scanned or photographed signature image (Max: 1MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  <span>{isUploading ? 'Uploading...' : 'Choose File'}</span>
                </button>
              </div>
            </div>

            {/* Draw Signature */}
            <div className="bg-green-50 rounded-lg p-6 border-2 border-dashed border-green-200">
              <div className="text-center">
                <PencilIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Draw Signature</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Draw your signature using mouse or touchscreen
                </p>
                <button
                  onClick={() => setShowDrawingCanvas(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Start Drawing</span>
                </button>
              </div>
            </div>
          </div>

          {/* Drawing Canvas */}
          {showDrawingCanvas && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Draw Your Signature</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={clearCanvas}
                    className="px-3 py-1 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowDrawingCanvas(false)}
                    className="px-3 py-1 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border-2 border-gray-300 p-4 mb-4">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-48 border border-gray-200 rounded cursor-crosshair"
                  style={{ touchAction: 'none' }}
                />
              </div>
              
              <div className="text-center">
                <button
                  onClick={saveDrawnSignature}
                  disabled={isUploading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>{isUploading ? 'Saving...' : 'Save Signature'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Current Active Signature */}
          {activeSignature && (
            <div className="bg-green-50 rounded-lg p-6 mb-8 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <CheckIcon className="w-5 h-5 mr-2" />
                Active Signature
              </h3>
              <div className="bg-white rounded-lg p-4 border border-green-300">
                <img
                  src={activeSignature.base64Data}
                  alt="Active signature"
                  className="max-h-24 mx-auto bg-white"
                  style={{ filter: 'none' }}
                />
                <p className="text-sm text-gray-600 text-center mt-2">
                  Uploaded: {new Date(activeSignature.uploadedAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500 text-center">
                  Size: {(activeSignature.fileSize / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}

          {/* Signatures List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Saved Signatures ({signatures.length})
            </h3>
            
            {signatures.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No signatures uploaded yet.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Upload or draw your signature to get started.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {signatures.map((signature) => (
                  <div
                    key={signature.id}
                    className={`bg-white rounded-lg border-2 p-4 ${
                      signature.isActive 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center mb-4">
                      <img
                        src={signature.base64Data}
                        alt="Signature"
                        className="max-h-16 mx-auto bg-white rounded"
                        style={{ filter: 'none' }}
                      />
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <p>Type: {signature.type === 'uploaded' ? 'Uploaded' : 'Hand-drawn'}</p>
                      <p>Date: {new Date(signature.uploadedAt).toLocaleDateString()}</p>
                      <p>Size: {(signature.fileSize / 1024).toFixed(1)} KB</p>
                      {signature.isActive && (
                        <p className="text-green-600 font-medium">✓ Active</p>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {!signature.isActive && (
                        <button
                          onClick={() => handleSetActive(signature.id)}
                          className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Set Active
                        </button>
                      )}
                      <button
                        onClick={() => setPreviewImage(signature.base64Data)}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(signature)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Signature Preview</h3>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="text-center bg-gray-50 rounded-lg p-8">
                <img
                  src={previewImage}
                  alt="Signature preview"
                  className="max-w-full max-h-64 mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Signature</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this signature? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSignature(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportDoctorSignature;