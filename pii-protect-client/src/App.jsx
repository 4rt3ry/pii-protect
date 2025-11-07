import React, { useState, useCallback } from 'react';

// --- PII FIELD DEFINITION ---
// Defines all fields and their requirements.
const PII_FORM_FIELDS = [
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


const App = () => {
  const [piiInput, setPiiInput] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'success', 'error', or null
  
  // Hardcoded SP for the prompt
  const SERVICE_PROVIDER = 'Chase Bank';


  // --- HANDLER FUNCTIONS ---
  const handlePiiInputChange = (e, key) => {
    let value = e.target.value;
    
    // Simple formatting for the Phone Number field for consistency
    if (key === 'phone') {
        value = value.replace(/[^\d]/g, ''); // Remove non-digits
        if (value.length > 10) value = value.slice(0, 10); // Limit to 10 digits
    }
    
    setPiiInput(prev => ({...prev, [key]: value}));
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Find the identifier (phone number)
    const phoneNumberIdentifier = piiInput.phone || '';
    
    if (!phoneNumberIdentifier) {
        alert("Please enter a phone number to identify the account.");
        return;
    }
    
    setIsSubmitting(true);
    setSubmissionStatus('loading');
    
    // 1. GATHER DATA: Assemble the payload ready for backend encryption
    const rawPayload = {
      // **CRITICAL CHANGE**: The identifier is the phone number
      customerIdentifier: phoneNumberIdentifier,
      timestamp: new Date().toISOString(),
      ...piiInput
    };
    
    // NOTE TO BACKEND TEAM: The 'customerIdentifier' key is now the 10-digit phone number 
    // submitted by the user. Use this number to look up the user's Reference PII in the database
    // before attempting decryption. The object 'rawPayload' would be passed here 
    // to the external encryption function (e.g., hybridEncrypt(rawPayload))
    // before being sent via REST API.

    console.log("Raw PII Payload prepared for encryption:", rawPayload);

    // ZERO-STORAGE PRINCIPLE: Clear input state immediately after payload assembly
    setPiiInput({});

    // Simulate Network/Encryption Delay (2 seconds)
    setTimeout(() => {
      setSubmissionStatus('success');
      setIsSubmitting(false);
    }, 2000);
  }, [piiInput]);


  // --- UI RENDERING LOGIC (PII Form Fields) ---
  const renderFormFields = () => {
    let currentSection = '';
    return PII_FORM_FIELDS.map((field) => {
      let sectionHeader = null;
      if (field.section && field.section !== currentSection) {
        currentSection = field.section;
        sectionHeader = (
          <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4 mt-6">
            {field.section}
          </h3>
        );
      }
      
      const fieldElement = (
        <div key={field.key} className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            {field.label} {field.required && <span className="text-blue-500">*</span>}
          </label>
          <input 
            type={field.type} 
            maxLength={field.maxLength}
            value={piiInput[field.key] || ''} 
            onChange={(e) => handlePiiInputChange(e, field.key)}
            className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 transition duration-150" 
            required={field.required}
            disabled={isSubmitting}
          />
        </div>
      );
      
      return (
        <React.Fragment key={field.key}>
          {sectionHeader}
          {fieldElement}
        </React.Fragment>
      );
    });
  };
  
  
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

        {/* PII INPUT FORM */}
        <form onSubmit={handleSubmit} className={`space-y-4 ${submissionStatus === 'loading' ? 'opacity-50' : ''}`} disabled={isSubmitting}>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                {renderFormFields()}
            </div>
            
            <div className="pt-4 border-t">
                {/* ZERO-STORAGE COMPLIANCE NOTE */}
                <p className="text-xs text-orange-600 mb-3">
                    Compliance Note: Input fields will be cleared immediately after successful submission to comply with **zero-storage requirements**.
                </p>
                {/* Submit Button */}
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
      </div>
    </div>
  );
};

export default App;
