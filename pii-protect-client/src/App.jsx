import { useState, useEffect } from "react";
import ClientInfoForm from './ClientInfoForm.jsx'
import Totp from './Totp.jsx'
import TestTotp from "./TestTotp.jsx";
import VerifiedPage from "./VerifiedPage.jsx"
import { generateEcdhKeyPair, exportPublicKeyToPem, importPublicKeyFromPem, deriveSymKey } from './crypto';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function App() {

    const [aesKey, setAesKey] = useState(null);
    const [totpSubmitted, setTotpSubmitted] = useState(false);
    const [verified, setVerified] = useState(false);
    // const [clientKeys, setClientKeys] = useState(null);

    async function beginHandshake() {
        const keyPair = await generateEcdhKeyPair();
        // setClientKeys(keyPair);

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
        if (totpSubmitted & !aesKey){
            beginHandshake();
        }
        
        //single_key_setup = false;
    }, [totpSubmitted]);

    let page;


    if (!totpSubmitted)
        page =
            <>
                <Totp></Totp>
                <TestTotp setTotpSubmitted={setTotpSubmitted}></TestTotp>
            </>;
    else if (!verified)
        page = <ClientInfoForm aesKey={aesKey} setVerified={setVerified}></ClientInfoForm>;
    else
        page = <VerifiedPage></VerifiedPage>;

    return page;
}
