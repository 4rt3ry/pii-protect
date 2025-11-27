

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

export default FormField