import React, { useCallback, useState } from 'react';
import FormField from './FormField';

const TOTP_FORM_FIELD = { key: 'totp', label: 'Simulate verbally giving TOTP to the service provider. ', type: 'text', required: true };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


/**
 * 
 */
export default function TestTotp(props) {
    const initialFormState = {
        totp: ""
    };
    const { setTotpSubmitted } = props;
    const [formData, setFormData] = useState(initialFormState);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

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

        setTotpSubmitted(true);
    }, [formData, setTotpSubmitted]);

    return (<>
        <form
            onSubmit={handleSubmit}
            className="w-full mx-auto bg-white p-8 rounded-lg shadow-md"
        >
            <FormField fieldData={TOTP_FORM_FIELD} value={formData["totp"]} onChange={handleChange}></FormField>
            <button
                type="submit"
                className="w-400px bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 hover:cursor-pointer transition duration-200"
            >
                Submit
            </button>
        </form>
    </>)

}