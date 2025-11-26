import React, { useState, useEffect, useCallback } from 'react';
import { generateEcdhKeyPair, exportPublicKeyToPem, importPublicKeyFromPem, deriveSymKey, aesEncrypt } from './crypto';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// TODO: should be retrieved from the server as an SSE
const PII_FORM_FIELDS = [
    { key: 'first_name', label: 'First Name', type: 'text', required: true },
    { key: 'last_name', label: 'Last Name', type: 'text', required: true },
    { key: 'phone', label: 'Phone Number', type: 'tel', required: true, isIdentifier: true }, // Added isIdentifier flag
    { key: 'ssn_last_4', label: 'Last 4 digits of SSN', type: 'text', maxLength: 4, required: false },

    // TODO: REMOVE TEMPORARY TOTP
    { key: 'totp', label: 'TOTP Code', type: 'text', required: true},
]

// let single_key_setup = true;

export default function ClientInfoForm() {
    const initialFormState = {
        first_name: "",
        last_name: "",
        ssn_last_4: "",
        phone: "+1 ",

        // TODO: REMOVE TEMPORARY TOTP
        totp: ""
    };


    // TODO: set values to "" and remove totp, these are just temporary values for testing
    const [clientKeys, setClientKeys] = useState(null);
    const [aesKey, setAesKey] = useState(null);
    const [formData, setFormData] = useState(initialFormState);

    async function beginHandshake() {
        const keyPair = await generateEcdhKeyPair();
        setClientKeys(keyPair);

        const pem = await exportPublicKeyToPem(keyPair.publicKey);

        const res = await fetch(`${API_BASE_URL}/post_public_key`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ public_key: pem })
        });

        const data = await res.json();

        const serverPub = await importPublicKeyFromPem(data.public_key);
        const sym = await deriveSymKey(keyPair.privateKey, serverPub);
        setAesKey(sym);
    }

    useEffect(() => {
        //if (single_key_setup)
            beginHandshake();
        //single_key_setup = false;
    }, []);

    function handleChange(e) {
        let { name, value } = e.target;

        // Auto-ensure "+1 " stays at the beginning and limit to 10 digits
        if (name === "phone") {
            value = value.replace(/(\D\d*\s*)+/g, "").slice(0, 10); // Keep only 10 digits
            value = "+1 " + value;
        }

        // ssn_last_4 must be 4-digit only
        if (name === "ssn_last_4") {
            value = value.replace(/\D/g, "").slice(0, 4);
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        // TODO: REMOVE TEMPORARY TEST CODE vvvvvvvvvvv
        const totpPayload = {
            'totp': formData["totp"]
        };

        // const totpResponse = await sendPost(API_BASE_URL + '/verify_totp', totpPayload);
        // console.log(totpResponse)
        // console.log(await totpResponse.json())
        // console.log(totpResponse.headers.get('Set-Cookie'));
        // totpResponse.headers.keys().forEach(k => console.log(k, ':', totpResponse.headers.get(k)))
        // TODO: REMOVE TEMP TEST CODE ^^^^^^^^^^^^

        const totpRes = await fetch(`${API_BASE_URL}/verify_totp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Session-Cookie": "HttpOnly"
            },
            credentials: 'include',
            body: JSON.stringify({ totp: formData.totp })
        });

        if (!totpRes.ok) {
            console.error("TOTP failed");
            return;
        }

        console.log(await totpRes.json())
        console.log(totpRes.headers.get('Set-Cookie'))

        // await beginHandshake();
        if (!aesKey) {
            console.error("Handshake key missing");
            return;
        }

        console.log("Raw PII Payload prepared for encryption:", formData);

        const rawPayload = {
            timestamp: new Date().toISOString(),
            ...formData
        };

        // ZERO-STORAGE PRINCIPLE: Clear input state immediately after payload assembly
        setFormData(initialFormState);


        const encryptedPayload = await aesEncrypt(aesKey, rawPayload);

        const response = await fetch(`${API_BASE_URL}/verify_pii`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify(encryptedPayload)
        });

        const verified = await response.json();
        console.log(verified)

        if (verified.status === 'verified') {
            console.log('PII Verified Successfully!');
        } else {
            console.error('PII verification failed');
            // TODO fail logic here
            return;
        }

    }, [formData, aesKey]);



    return (
        <form
        onSubmit={handleSubmit}
        className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md"
        >
        <h2 className="text-2xl font-bold mb-1 text-center">PII Protect Form</h2>
        <p className="text-sm text-gray-600 mb-6 text-center">
        Your data will be encrypted and securely transmitted in accordance with industry best practices.
        </p>

        {
            PII_FORM_FIELDS.map((field) => (
                <FormField
                fieldData={field}
                value={formData[field.key]}
                onChange={handleChange}
                key={field.key}
                ></FormField>
            ))
        }


        <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
        >
        Submit
        </button>
        </form>
    );
}

const FormField = ({ fieldData, value, onChange }) => (
    <label
    className="block mb-4"
    key={fieldData.key}
    >
    <span className="block font-medium text-gray-800">
    {fieldData.label}
    <span className="text-red-500">*</span>
    </span>
    <input
    type={fieldData.type}
    name={fieldData.key}
    value={value}
    onChange={onChange}
    maxLength={fieldData.maxLength || -1}
    required
    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    </label>
);



export function ClientInfoFormOld({ piiFields, serviceProvider, submissionStatus, setSubmissionStatus }) {

    const [piiInput, setPiiInput] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // TEST ONLY TODO: REMOVE WHEN TOTP IS IMPLEMENTED

    const totpField = { key: 'totp', label: 'TOTP Code (TEMPORARY)', type: 'text', required: true, section: 'Mandatory Information' };
    piiFields = [...piiFields, totpField];

    //


    // --- HANDLER FUNCTIONS ---
    const handlePiiInputChange = (e, key) => {
        let value = e.target.value;

        // Simple formatting for the Phone Number field for consistency
        if (key === 'phone') {
            value = value.replace(/[^\d]/g, ''); // Remove non-digits
            if (value.length > 10) value = value.slice(0, 10); // Limit to 10 digits
        }

        setPiiInput(prev => ({ ...prev, [key]: value }));
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
