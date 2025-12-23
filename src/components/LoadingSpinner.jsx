import React from 'react';

const LoadingSpinner = ({ message = 'Carregando...' }) => {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-5 rounded-lg shadow-xl flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
                <p className="text-gray-700 font-medium">{message}</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
