import { useState } from "react";

export default function ClientInfoForm({ onSubmit }) {
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