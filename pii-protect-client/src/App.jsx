import { useState } from "react";

export default function ClientInfoForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    ssn_last_4: "",
    phone: "+1 ",
  });

  function handleChange(e) {
    let { name, value } = e.target;

    // Auto-ensure "+1 " stays at the beginning and limit to 10 digits
    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10); // Keep only 10 digits
      value = "+1 " + value;
    }

    // ssn_last_4 must be 4-digit only
    if (name === "ssn_last_4") {
      value = value.replace(/\D/g, "").slice(0, 4);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md"
    >
      <h2 className="text-2xl font-bold mb-1 text-center">PII Protect Form</h2>
      <p className="text-sm text-gray-600 mb-6 text-center">
        Your data will be encrypted and securely transmitted in accordance with industry best practices.
      </p>

      <label className="block mb-4">
        <span className="block font-medium text-gray-800">
          First Name <span className="text-red-500">*</span>
        </span>
        <input
          type="text"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <label className="block mb-4">
        <span className="block font-medium text-gray-800">
          Last Name <span className="text-red-500">*</span>
        </span>
        <input
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <label className="block mb-4">
        <span className="block font-medium text-gray-800">
          Last 4 digits of SSN <span className="text-red-500">*</span>
        </span>
        <input
          type="text"
          name="ssn_last_4"
          value={formData.ssn_last_4}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <label className="block mb-6">
        <span className="block font-medium text-gray-800">
          Phone Number (US) <span className="text-red-500">*</span>
        </span>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
      >
        Submit
      </button>
    </form>
  );
}
