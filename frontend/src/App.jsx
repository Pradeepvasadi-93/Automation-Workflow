import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import Leads from "./pages/Leads";
import Drafts from "./pages/Drafts";
import Messages from "./pages/Messages";
import Sequences from "./pages/Sequences";
import Login from "./pages/Login";
import FlowProvider from "./context/FlowContext";
import Approval from "./pages/Approval";
import Form from "./pages/Form";
import Paidplan from "./pages/Paidplan";

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <FlowProvider>
      <Router>
        <Routes>
        {/* Login route without sidebar */}
        <Route path="/" element={<Login />} />
        <Route path="/form" element={<Form />} />
        <Route path="/plan" element={<Paidplan />} />
        {/* Protected routes with sidebar */}
        <Route
          path="/*"
          element={
            <div className="flex min-h-screen">
              <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
              <div className="flex-1 flex flex-col">
                {/* Mobile header */}
                <div className="md:hidden bg-gray-900 text-white p-4 flex items-center justify-between">
                  <h1 className="text-lg font-bold">Workflow</h1>
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="text-white focus:outline-none"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 p-4 md:p-6 bg-gray-100">
                  <Routes>
                    <Route path="/overview" element={<Overview />} />
                    <Route path="/leads" element={<Leads />} />
                    <Route path="/drafts" element={<Drafts />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/sequences" element={<Sequences />} />
                    <Route path="/approvals" element={<Approval />} />
                  </Routes>
                </div>
              </div>
            </div>
          }
        />
        </Routes>
      </Router>
    </FlowProvider>
  );
}

export default App;