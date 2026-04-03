import React, { useState } from "react";

const Form = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    query: "",
  });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const scriptURL =
    "https://script.google.com/macros/s/AKfycbzlAziFrGDEqdWBlcCkWxMlwANlD0KKtgKZzNumEYHw2jMfRk1rueibw7wIVdAzTDs/exec";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const [sheetRes, mongoRes] = await Promise.all([
        fetch(scriptURL, {
          method: "POST",
          body: new FormData(e.target),
        }),
        fetch("http://localhost:5000/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }),
      ]);

      const sheetData = await sheetRes.json();
      const mongoData = await mongoRes.json();

      console.log("Saved to Google Sheet:", sheetData);
      console.log("Saved to MongoDB:", mongoData);

      setLoading(false);
      setModalOpen(true);
      setFormData({ name: "", email: "", phone: "", query: "" });
    } catch (error) {
      console.error("Error!", error.message);
      setLoading(false);
      alert("Submission failed. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] p-4 sm:p-6">
      <div className="bg-white text-black shadow-lg rounded-lg p-4 sm:p-6 w-full max-w-md flex flex-col items-center gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-center">Lead Input Form</h2>
        <form
          id="leadForm"
          className="flex flex-col gap-4 w-full"
          onSubmit={handleSubmit}
        >
          <input
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
          <input
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
          <input
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
          <textarea
            name="query"
            placeholder="Query"
            rows="5"
            value={formData.query}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-600 text-white font-semibold rounded-md p-2 w-4/5 self-center transition-transform ${
              loading
                ? "bg-blue-300 cursor-not-allowed"
                : "hover:bg-blue-700 hover:scale-105"
            }`}
          >
            {loading ? "Saving..." : "Save"}
          </button>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold text-sm">
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span>Submitting...</span>
            </div>
          )}
        </form>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-sm flex flex-col justify-center items-center text-center">
            <h1 className="text-xl sm:text-2xl font-bold">Done</h1>
            <p className="mt-2 text-gray-600">Submitted Successfully</p>
            <button
              onClick={() => setModalOpen(false)}
              className="mt-4 bg-blue-600 text-white font-semibold rounded-md px-4 py-2 hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Form;