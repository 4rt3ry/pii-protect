import React, { useState, useCallback } from 'react';
import {sendGet, sendPost} from './routes.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


export function ClientInfoForm ({ piiFields, serviceProvider, submissionStatus, setSubmissionStatus}) {

    const [piiInput, setPiiInput] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // TEST ONLY TODO: REMOVE WHEN TOTP IS IMPLEMENTED
    
    const totpField = { key: 'totp', label: 'TOTP Code (TEMPORARY)', type: 'text', required: true, section: 'Mandatory Information' };
    piiFields = [... piiFields, totpField ];

    //


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

        // TEST ONLY TODO: REMOVE WHEN TOTP IS IMPLEMENTED
        
        const totpPayload = {
            'totp': piiInput["totp"]
        };

        const totpResponse = await sendPost(API_BASE_URL + '/verify_totp', totpPayload);
        console.log(totpResponse)
        console.log(totpResponse.headers.get('Set-Cookie'));
        totpResponse.headers.keys().forEach(k => console.log(k, ':', totpResponse.headers.get(k)))
        debugger

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

    console.log(piiFields)

    // --- UI RENDERING LOGIC (PII Form Fields) ---
    const renderFormFields = () => {
        let currentSection = '';
        return piiFields.map((field) => {
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

    return (
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
    );
}

export function ClientInfoFormOld({ onSubmit }) {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        ssn_last_4: "",
        phone: "+1 "
    });

    function handleChange(e) {
        let { name, value } = e.target;

        // Auto-ensure "+1 " stays at the beginning
        if (name === "phone") {
            if (!value.startsWith("+1 ")) {
                value = "+1 " + value.replace("+1", "").trim();
            }
        }

        // ssn_last_4 must be 4-digit only
        if (name === "ssn_last_4") {
            value = value.replace(/\D/g, "").slice(0, 4);
        }

        setFormData({ ...formData, [name]: value });
    }

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
        <label>First Name</label>
        <input
        name="first_name"
        value={formData.first_name}
        onChange={handleChange}
        required
        />

        <label>Last Name</label>
        <input
        name="last_name"
        value={formData.last_name}
        onChange={handleChange}
        required
        />

        <label>SSN Last 4</label>
        <input
        name="ssn_last_4"
        value={formData.ssn_last_4}
        onChange={handleChange}
        maxLength={4}
        required
        />

        <label>Phone Number</label>
        <input
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        required
        />

        <button type="submit">Verify</button>
        </form>
    );
}

// ********** USAGE **********
// async function submitClientInfo(info) {
//   const res = await fetch("http://localhost:5000/verify_pii", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(info)
//   });

//   const data = await res.json();
//   console.log("Verification result:", data);
// }

// <ClientInfoForm onSubmit={submitClientInfo} />
