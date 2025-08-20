import { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { database } from "../../../firebase/firebase";
import { 
  Star, 
  MessageSquare, 
  User, 
  Calendar, 
  Mail, 
  Tag, 
  Filter,
  Search,
  Eye,
  Clock,
  TrendingUp,
  BarChart3,
  Check,
  Flag,
  AlertCircle,
  MoreVertical
} from "lucide-react";

const DoctorFeedbacks = ({ doctors, clinicsMap }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const feedbackRef = ref(database, "feedback");
    
    const unsubscribe = onValue(feedbackRef, (snapshot) => {
      const feedbackData = snapshot.val() || {};
      const feedbackList = [];
      
      Object.entries(feedbackData).forEach(([key, feedback]) => {
        feedbackList.push({
          id: key,
          ...feedback
        });
      });
      
      // Sort by creation date (newest first)
      feedbackList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      setFeedbacks(feedbackList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateFeedbackStatus = async (feedbackId, newStatus) => {
    try {
      setUpdatingStatus(feedbackId);
      const feedbackRef = ref(database, `feedback/${feedbackId}`);
      await update(feedbackRef, { 
        status: newStatus,
        updatedAt: Date.now()
      });
      setShowDropdown(null);
    } catch (error) {
      console.error('Error updating feedback status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(doc => doc.id === doctorId);
    return doctor ? doctor.fullName : 'Unknown Doctor';
  };

  const getClinicName = (clinicId) => {
    return clinicsMap[clinicId] || 'Unknown Clinic';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown Date';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStarRating = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'flagged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'reviewed':
        return <Check size={12} />;
      case 'flagged':
        return <Flag size={12} />;
      default:
        return <Clock size={12} />;
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const StatusDropdown = ({ feedback, onClose }) => (
    <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
      <div className="py-1">
        {feedback.status !== 'reviewed' && (
          <button
            onClick={() => updateFeedbackStatus(feedback.id, 'reviewed')}
            disabled={updatingStatus === feedback.id}
            className="w-full px-4 py-2 text-sm text-left text-green-700 hover:bg-green-50 flex items-center space-x-2"
          >
            <Check size={14} />
            <span>Mark Reviewed</span>
          </button>
        )}
        {feedback.status !== 'flagged' && (
          <button
            onClick={() => updateFeedbackStatus(feedback.id, 'flagged')}
            disabled={updatingStatus === feedback.id}
            className="w-full px-4 py-2 text-sm text-left text-red-700 hover:bg-red-50 flex items-center space-x-2"
          >
            <Flag size={14} />
            <span>Flag</span>
          </button>
        )}
        {feedback.status !== 'pending' && (
          <button
            onClick={() => updateFeedbackStatus(feedback.id, 'pending')}
            disabled={updatingStatus === feedback.id}
            className="w-full px-4 py-2 text-sm text-left text-yellow-700 hover:bg-yellow-50 flex items-center space-x-2"
          >
            <Clock size={14} />
            <span>Mark Pending</span>
          </button>
        )}
      </div>
    </div>
  );

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const doctorMatch = selectedDoctor === 'all' || feedback.doctorId === selectedDoctor;
    const ratingMatch = selectedRating === 'all' || feedback.rating.toString() === selectedRating;
    const searchMatch = searchTerm === '' || 
      feedback.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getDoctorName(feedback.doctorId).toLowerCase().includes(searchTerm.toLowerCase());
    
    return doctorMatch && ratingMatch && searchMatch;
  });

  // Calculate statistics
  const stats = {
    total: feedbacks.length,
    averageRating: feedbacks.length > 0 
      ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length).toFixed(1)
      : 0,
    recentFeedbacks: feedbacks.filter(fb => {
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return fb.createdAt > weekAgo;
    }).length,
    highRating: feedbacks.filter(fb => fb.rating >= 4).length
  };

  // Pagination
  const totalPages = Math.ceil(filteredFeedbacks.length / itemsPerPage);
  const currentItems = filteredFeedbacks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(null);
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-2">
          <MessageSquare className="animate-pulse" size={32} />
          <div className="text-lg">Loading feedbacks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <MessageSquare size={24} />
          <span>Patient Feedbacks</span>
        </h2>
        <p className="text-gray-600 mt-1">View and manage patient feedback and ratings</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
          <h3 className="text-sm font-semibold text-blue-800">Total Feedbacks</h3>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
          <p className="text-xs text-blue-600">All time</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
          <h3 className="text-sm font-semibold text-green-800">Average Rating</h3>
          <p className="text-2xl font-bold text-green-900">{stats.averageRating}</p>
          <p className="text-xs text-green-600">Out of 5 stars</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
          <h3 className="text-sm font-semibold text-purple-800">Recent Feedbacks</h3>
          <p className="text-2xl font-bold text-purple-900">{stats.recentFeedbacks}</p>
          <p className="text-xs text-purple-600">This week</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
          <h3 className="text-sm font-semibold text-orange-800">High Ratings</h3>
          <p className="text-2xl font-bold text-orange-900">{stats.highRating}</p>
          <p className="text-xs text-orange-600">4+ star reviews</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search feedbacks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Doctor Filter */}
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Doctors</option>
            {doctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>
            ))}
          </select>

          {/* Rating Filter */}
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {/* Results Count */}
          <div className="flex items-center text-sm text-gray-600">
            <Filter size={16} className="mr-1" />
            {filteredFeedbacks.length} of {feedbacks.length} feedbacks
          </div>
        </div>
      </div>

      {/* Feedbacks Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-900">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="px-4 py-3 text-left">Patient & Doctor</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3 text-left">Comment</th>
                <th className="px-4 py-3 text-center">Treatment</th>
                <th className="px-4 py-3 text-center">Date</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((feedback) => (
                <tr key={feedback.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <User size={16} className="text-gray-400" />
                        <span className="font-medium">
                          {feedback.isAnonymous ? 'Anonymous' : feedback.patientName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>to</span>
                        <span className="font-medium text-blue-600">
                          {getDoctorName(feedback.doctorId)}
                        </span>
                      </div>
                      {feedback.patientEmail && !feedback.isAnonymous && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Mail size={12} />
                          <span>{feedback.patientEmail}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center space-y-1">
                      {renderStarRating(feedback.rating)}
                      <span className={`font-semibold text-sm ${getRatingColor(feedback.rating)}`}>
                        {feedback.rating}/5
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {feedback.comment || 'No comment provided'}
                      </p>
                      {feedback.tags && feedback.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {feedback.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              <Tag size={10} className="mr-1" />
                              {tag}
                            </span>
                          ))}
                          {feedback.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{feedback.tags.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div>
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                        {feedback.treatmentType || 'N/A'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {getClinicName(feedback.clinicId)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm">
                      <div className="flex items-center justify-center space-x-1">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{feedback.appointmentDate}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-1 mt-1 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>{formatDate(feedback.createdAt)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(feedback.status)}`}>
                        {getStatusIcon(feedback.status || 'pending')}
                        <span>{feedback.status || 'pending'}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setSelectedFeedback(feedback)}
                        className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md transition-colors text-xs"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDropdown(showDropdown === feedback.id ? null : feedback.id);
                          }}
                          disabled={updatingStatus === feedback.id}
                          className="flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                        >
                          {updatingStatus === feedback.id ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <MoreVertical size={16} className="text-gray-600" />
                          )}
                        </button>
                        {showDropdown === feedback.id && (
                          <StatusDropdown 
                            feedback={feedback} 
                            onClose={() => setShowDropdown(null)} 
                          />
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-gray-500 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <MessageSquare size={32} className="text-gray-300" />
                      <span>No feedbacks found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <span>
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredFeedbacks.length)} of {filteredFeedbacks.length} results
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-2 text-sm border border-gray-300 rounded-md ${
                    currentPage === i + 1
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              )).slice(Math.max(0, currentPage - 3), currentPage + 2)}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Feedback Details</h3>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Patient and Doctor Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Patient Information</h4>
                  <div className="space-y-1">
                    <p><span className="font-medium">Name:</span> {selectedFeedback.isAnonymous ? 'Anonymous' : selectedFeedback.patientName}</p>
                    {selectedFeedback.patientEmail && !selectedFeedback.isAnonymous && (
                      <p><span className="font-medium">Email:</span> {selectedFeedback.patientEmail}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Doctor & Treatment</h4>
                  <div className="space-y-1">
                    <p><span className="font-medium">Doctor:</span> {getDoctorName(selectedFeedback.doctorId)}</p>
                    <p><span className="font-medium">Treatment:</span> {selectedFeedback.treatmentType}</p>
                    <p><span className="font-medium">Clinic:</span> {getClinicName(selectedFeedback.clinicId)}</p>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Rating</h4>
                <div className="flex items-center space-x-2">
                  {renderStarRating(selectedFeedback.rating)}
                  <span className={`font-semibold ${getRatingColor(selectedFeedback.rating)}`}>
                    {selectedFeedback.rating}/5
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Comment</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedFeedback.comment || 'No comment provided'}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedFeedback.tags && selectedFeedback.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeedback.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        <Tag size={14} className="mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates and Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">Appointment Date</p>
                  <p className="font-medium">{selectedFeedback.appointmentDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Feedback Date</p>
                  <p className="font-medium">{formatDate(selectedFeedback.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 text-sm font-medium rounded ${getStatusColor(selectedFeedback.status)}`}>
                    {getStatusIcon(selectedFeedback.status || 'pending')}
                    <span>{selectedFeedback.status || 'pending'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div className="flex space-x-2">
                {selectedFeedback.status !== 'reviewed' && (
                  <button
                    onClick={() => updateFeedbackStatus(selectedFeedback.id, 'reviewed')}
                    disabled={updatingStatus === selectedFeedback.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingStatus === selectedFeedback.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Check size={16} />
                    )}
                    <span>Mark Reviewed</span>
                  </button>
                )}
                {selectedFeedback.status !== 'flagged' && (
                  <button
                    onClick={() => updateFeedbackStatus(selectedFeedback.id, 'flagged')}
                    disabled={updatingStatus === selectedFeedback.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingStatus === selectedFeedback.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Flag size={16} />
                    )}
                    <span>Flag</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorFeedbacks;