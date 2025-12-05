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

    

    let page;


    if (!totpSubmitted)
        page =
            <>
                <Totp></Totp>
                <TestTotp setTotpSubmitted={setTotpSubmitted} setAesKey={setAesKey}></TestTotp>
            </>;
    else if (!verified)
        page = <ClientInfoForm aesKey={aesKey} setVerified={setVerified}></ClientInfoForm>;
    else
        page = <VerifiedPage></VerifiedPage>;

    return page;
}
