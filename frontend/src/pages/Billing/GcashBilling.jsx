import React, { useState, useEffect } from 'react';
import { ref, update } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { X, Smartphone, Copy, CheckCircle, AlertCircle, CreditCard, Timer, RefreshCw, Upload } from 'lucide-react';
import BillingSuccessModal from './BillingSuccessModal'; // Import the success modal
// Import your QR code image - update the path to match your file structure
import gcashQRImage from '../../../public/gcash-qr-code.jpg'; // Adjust path as needed

const GcashBilling = ({ billing, onClose, onPaymentSuccess }) => {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Show QR, 2: Enter reference
  const [paymentTimer, setPaymentTimer] = useState(300); // 5 minutes timer
  const [isTimerActive, setIsTimerActive] = useState(true);

  // Success modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({});

  // GCash account details (replace with your actual details)
  const GCASH_NUMBER = '+639099855322';
  const GCASH_NAME = 'Jetch Merald Madaya';
  
  // Using imported QR code image from src folder
  const STATIC_GCASH_QR = gcashQRImage;

  // Payment timer countdown
  useEffect(() => {
    let interval;
    if (isTimerActive && paymentTimer > 0) {
      interval = setInterval(() => {
        setPaymentTimer(prev => prev - 1);
      }, 1000);
    } else if (paymentTimer === 0) {
      setIsTimerActive(false);
      setError('Payment session expired. Please try again.');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, paymentTimer]);

  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy GCash number to clipboard
  const copyGCashNumber = async () => {
    try {
      await navigator.clipboard.writeText(GCASH_NUMBER);
      // Show temporary success feedback
      const button = document.getElementById('copy-button');
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>Copied!';
        setTimeout(() => {
          button.innerHTML = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Handle payment verification
  const handlePaymentVerification = async () => {
    if (!referenceNumber.trim()) {
      setError('Please enter the GCash reference number');
      return;
    }

    if (!paidAmount || parseFloat(paidAmount) !== billing.amount) {
      setError(`Please confirm the exact amount paid: ₱${billing.amount.toFixed(2)}`);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Update billing status in Firebase
      const billingRef = ref(database, `clinicBilling/${billing.id}`);
      await update(billingRef, {
        status: 'paid',
        paidDate: new Date().toISOString(),
        paymentMethod: 'gcash',
        gcashReference: referenceNumber.trim(),
        gcashPaidAmount: parseFloat(paidAmount),
        gcashPaymentDetails: {
          merchantNumber: GCASH_NUMBER,
          merchantName: GCASH_NAME,
          verifiedAt: new Date().toISOString(),
          sessionId: `gcash_${billing.id}_${Date.now()}`
        }
      });

      // Show success modal instead of calling onPaymentSuccess immediately
      setSuccessModalData({
        type: 'marked_paid',
        patientName: billing.patientFullName,
        amount: billing.amount,
        additionalInfo: `GCash payment successful! Reference: ${referenceNumber.trim()}`
      });
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Call the original success callback and close the GCash modal
    if (onPaymentSuccess) {
      onPaymentSuccess({
        billingId: billing.id,
        patientName: billing.patientFullName,
        amount: billing.amount,
        reference: referenceNumber.trim(),
        method: 'gcash',
        transactionId: referenceNumber.trim(),
        referenceNumber: referenceNumber.trim()
      });
    }
    // Close the GCash billing modal after a short delay
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Reset timer
  const resetTimer = () => {
    setPaymentTimer(300);
    setIsTimerActive(true);
    setError('');
  };

  if (!billing) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-full">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">GCash Payment</h2>
                <p className="text-sm text-gray-600">Secure mobile payment</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Bill Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Patient:</span>
                  <span className="font-medium">{billing.patientFullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bill ID:</span>
                  <span className="font-medium">{billing.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ₱{billing.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {step === 1 && (
              <>
                {/* Timer */}
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Timer className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">
                        Payment expires in: {formatTimer(paymentTimer)}
                      </span>
                    </div>
                    {paymentTimer < 60 && (
                      <button
                        onClick={resetTimer}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Scan QR Code with GCash App
                  </h3>
                  
                  {/* QR CODE FROM SRC FOLDER */}
                  <div className="bg-white border border-gray-300 p-4 rounded-lg inline-block shadow-sm">
                    <img
                      src={STATIC_GCASH_QR}
                      alt="GCash Payment QR Code"
                      className="w-64 h-64 mx-auto object-contain"
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                    Open your GCash app and scan this QR code to make the payment
                  </p>
                  
                  {/* Important Payment Instructions */}
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mt-4">
                    <p className="text-sm text-yellow-800 font-medium mb-1">
                      ⚠️ Important Payment Instructions:
                    </p>
                    <p className="text-xs text-yellow-700">
                      After scanning, manually enter ₱{billing.amount.toFixed(2)} as the amount and include "Bill #{billing.id}" in the message field.
                    </p>
                  </div>
                </div>

                {/* Manual Payment Option */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Or pay manually:</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Send to:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-semibold">{GCASH_NUMBER}</span>
                          <button
                            id="copy-button"
                            onClick={copyGCashNumber}
                            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Account Name:</span>
                        <span className="font-semibold text-sm">{GCASH_NAME}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Amount:</span>
                        <span className="font-bold text-blue-600">₱{billing.amount.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Include "Bill #{billing.id}" in your message
                      </div>
                    </div>
                  </div>
                </div>

                {/* Continue Button */}
                <div className="mt-6">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!isTimerActive}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Payment Made</span>
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {/* Back Button */}
                <button
                  onClick={() => setStep(1)}
                  className="mb-4 text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
                >
                  <span>← Back to QR Code</span>
                </button>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Confirm Payment Details
                </h3>

                <div className="space-y-4">
                  {/* Reference Number Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GCash Reference Number *
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Enter reference number from GCash"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      maxLength={20}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Find this in your GCash transaction history
                    </p>
                  </div>

                  {/* Amount Confirmation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Paid *
                    </label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder={billing.amount.toFixed(2)}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Must match exactly: ₱{billing.amount.toFixed(2)}
                    </p>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <span className="text-red-800 text-sm">{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handlePaymentVerification}
                    disabled={isProcessing || !referenceNumber.trim() || !paidAmount}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>Confirm Payment</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Security Note */}
                <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Security Note:</p>
                      <p>Never share your GCash PIN or OTP with anyone. We only need the reference number to verify your payment.</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <span>Secured by</span>
              <span className="font-semibold text-blue-600">GCash</span>
              <span>•</span>
              <span>Powered by CDU Hospital System</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <BillingSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        type={successModalData.type}
        patientName={successModalData.patientName}
        amount={successModalData.amount}
        additionalInfo={successModalData.additionalInfo}
      />
    </>
  );
};

export default GcashBilling;