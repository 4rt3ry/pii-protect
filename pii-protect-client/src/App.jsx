import React, { useState, useCallback } from 'react';
import {ClientInfoForm} from './ClientInfoForm.jsx'

// --- PII FIELD DEFINITION ---
// Defines all fields and their requirements.
const ALL_PII_FORM_FIELDS = [
  // --- MANDATORY FIELDS ---
  { key: 'firstName', label: 'First Name', type: 'text', required: true, section: 'Mandatory Information' },
  { key: 'lastName', label: 'Last Name', type: 'text', required: true },
  { key: 'phone', label: 'Phone Number', type: 'tel', required: true, isIdentifier: true }, // Added isIdentifier flag
  { key: 'dob', label: 'Date of Birth (MM/DD/YYYY)', type: 'text', required: true },
  { key: 'streetAddress', label: 'Street Address', type: 'text', required: true },
  { key: 'city', label: 'City', type: 'text', required: true },
  { key: 'zipCode', label: 'Zip Code', type: 'text', required: true },
  
  // --- OPTIONAL FIELDS ---
  { key: 'email', label: 'Email Address', type: 'email', required: false, section: 'Optional Authentication Details' },
  { key: 'ssnLastDigit', label: 'Last Digit of SSN', type: 'text', maxLength: 1, required: false },
  
  // --- FINANCIAL INFORMATION (Highly Sensitive) ---
  { key: 'creditCard', label: 'Credit Card Number', type: 'text', required: false, section: 'Financial Details (Optional)' },
  { key: 'expDate', label: 'Expiration Date (MM/YY)', type: 'text', maxLength: 5, required: false },
  { key: 'cvv', label: 'CVV', type: 'text', maxLength: 4, required: false },

  // --- ADDITIONAL AUTHENTICATION FIELDS ---
  { key: 'securityQuestion', label: 'Mother\'s Maiden Name', type: 'text', required: false, section: 'Security Questions (Optional)' },
];

// TODO: should be retrieved from the server as an SSE
const PII_FORM_FIELDS = [
  { key: 'firstName', label: 'First Name', type: 'text', required: true, section: 'Mandatory Information' },
  { key: 'lastName', label: 'Last Name', type: 'text', required: true },
  { key: 'phone', label: 'Phone Number', type: 'tel', required: true, isIdentifier: true }, // Added isIdentifier flag
  { key: 'ssnLastFour', label: 'Last 4 digits of SSN', type: 'text', maxLength: 4, required: false },
]


// Hardcoded SP for the prompt
const SERVICE_PROVIDER = 'Chase Bank';

const App = () => {

    const [submissionStatus, setSubmissionStatus] = useState(null); // 'success', 'error', or null
  
  
  // --- MAIN RENDER ---
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-2xl border border-gray-200">
        
        {/* HEADER & CONTEXT */}
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Secure PII Input Portal</h1>
        
        {/* Authentication Request Alert */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-lg shadow-sm">
            <p className="font-semibold text-blue-700">
                Authentication Request:
            </p>
            <p className="text-blue-600">
                **{SERVICE_PROVIDER}** is requesting your personal information for **authentication** purposes.
                Your data will be encrypted before transmission.
            </p>
        </div>

        {/* SUBMISSION STATUS DISPLAY */}
        {(submissionStatus === 'loading' || submissionStatus === 'success') && (
            <div className={`p-5 mb-6 rounded-xl font-bold transition duration-300 fade-in
                ${submissionStatus === 'success' ? 'bg-green-100 text-green-700 border border-green-400' : 'bg-yellow-100 text-yellow-700 border border-yellow-400'}`}>
                
                {submissionStatus === 'loading' && (
                    <p>Your information is now being **encrypted and sent to {SERVICE_PROVIDER}**.</p>
                )}
                
                {submissionStatus === 'success' && (
                    <p>Submission Complete! The encrypted payload has been sent to the server for validation.</p>
                )}
            </div>
        )}

        <ClientInfoForm 
            piiFields={PII_FORM_FIELDS}
            serviceProvider = {SERVICE_PROVIDER}
            submissionStatus={submissionStatus} 
            setSubmissionStatus={setSubmissionStatus}
        />
      
        {/*
        {/* PII INPUT FORM * /}
        <form onSubmit={handleSubmit} className={`space-y-4 ${submissionStatus === 'loading' ? 'opacity-50' : ''}`} disabled={isSubmitting}>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                {renderFormFields()}
            </div>
            
            <div className="pt-4 border-t">
                {/* ZERO-STORAGE COMPLIANCE NOTE * /}
                <p className="text-xs text-orange-600 mb-3">
                    Compliance Note: Input fields will be cleared immediately after successful submission to comply with **zero-storage requirements**.
                </p>
                {/* Submit Button * /}
                <button 
                    type="submit" 
                    className={`w-full py-3 px-4 rounded-lg text-lg font-bold text-white shadow-md transition duration-200 
                        ${isSubmitting 
                        ? 'bg-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50'
                        }`}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'PREPARING PAYLOAD FOR ENCRYPTION...' : 'Submit PII for Authentication'}
                </button>
            </div>
        </form>
        */}
      </div>
    </div>
  );
};

export default App;
