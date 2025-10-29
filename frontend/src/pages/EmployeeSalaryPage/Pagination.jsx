import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, startIndex, endIndex, totalItems, onPageChange }) => (
  <div className="flex items-center justify-between mt-6 bg-white rounded-lg p-4 shadow">
    <div className="text-sm text-gray-600">
      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
      <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
      <span className="font-medium">{totalItems}</span> employees
    </div>
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      {[...Array(totalPages)].map((_, index) => {
        const page = index + 1;
        if (
          page === 1 ||
          page === totalPages ||
          (page >= currentPage - 2 && page <= currentPage + 2)
        ) {
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          );
        } else if (page === currentPage - 3 || page === currentPage + 3) {
          return <span key={page} className="px-2 text-gray-400">...</span>;
        }
        return null;
      })}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default Pagination;