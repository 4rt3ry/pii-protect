import { useState, useCallback } from 'react';
import { aesEncrypt } from './crypto';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// TODO: should be retrieved from the server as an SSE
const PII_FORM_FIELDS = [
    { key: 'first_name', label: 'First Name', type: 'text', required: true },
    { key: 'last_name', label: 'Last Name', type: 'text', required: true },
    { key: 'phone', label: 'Phone Number', type: 'tel', required: true, isIdentifier: true }, // Added isIdentifier flag
    { key: 'ssn_last_4', label: 'Last 4 digits of SSN', type: 'text', maxLength: 4, required: false },
];

const initialFormState = {
    first_name: "",
    last_name: "",
    ssn_last_4: "",
    phone: "+1 ",
};

// let single_key_setup = true;

export default function ClientInfoForm({ ...props }) {


    const [formData, setFormData] = useState(initialFormState);
    const { aesKey, setVerified } = props;

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

        // await beginHandshake();
        if (!aesKey) {
            console.error("Handshake key missing");
            return;
        }

        // console.log("Raw PII Payload prepared for encryption:", formData);

        const rawPayload = {
            timestamp: new Date().toISOString(),
            ...formData
        };

        // console.log("aes", aesKey)
        const encryptedPayload = await aesEncrypt(aesKey, rawPayload);

        const response = await fetch(`${API_BASE_URL}/verify_pii`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify(encryptedPayload)
        });

        const verified = await response.json();
        // console.log(verified)


        // ZERO-STORAGE PRINCIPLE: Clear input state immediately after payload assembly
        setFormData(initialFormState);

        if (verified.status === 'verified') {
            console.log('PII Verified Successfully!');
            setVerified(true);
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