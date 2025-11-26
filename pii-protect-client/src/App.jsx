import { useState } from "react";
import ClientInfoForm from './ClientInfoForm.jsx'


export default function App() {
  return (
    <ClientInfoForm></ClientInfoForm>
    // TODO: TOTP goes here
  )
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