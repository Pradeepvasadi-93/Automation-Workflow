import { useState, useEffect, useMemo } from "react";

const STATUS_FILTERS = ["all", "pending", "completed"];

export default function Leads() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch leads from API
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch("http://localhost:5000/lead/get");
        const data = await response.json();
        console.log("Fetched leads:", data);

      const leadsArray = Array.isArray(data.leads)
        ? data.leads
        : Array.isArray(data)
        ? data
        : [];

      setLeads(leadsArray);
      } catch (error) {
        console.error("Error fetching leads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    if (statusFilter === "all") return leads;
    return leads.filter(
      (lead) => (lead.status || "").toLowerCase() === statusFilter
    );
  }, [statusFilter, leads]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Leads</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and review all incoming lead inquiries.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold">
            Total Leads: {leads.length}
          </div>

          <div className="flex gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                  statusFilter === filter
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {filter === "all"
                  ? "All"
                  : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-175 text-sm text-left">
            <caption className="sr-only">
              List of leads with contact details and queries
            </caption>

            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-3 sm:px-6 py-4 font-semibold text-gray-600 text-xs sm:text-sm">
                  Name
                </th>
                <th scope="col" className="px-3 sm:px-6 py-4 font-semibold text-gray-600 text-xs sm:text-sm">
                  Email
                </th>
                <th scope="col" className="px-3 sm:px-6 py-4 font-semibold text-gray-600 text-xs sm:text-sm">
                  Phone
                </th>
                <th scope="col" className="px-3 sm:px-6 py-4 font-semibold text-gray-600 text-xs sm:text-sm">
                  Query
                </th>
                <th
                  scope="col"
                  className="px-3 sm:px-6 py-4 font-semibold text-gray-600 text-center text-xs sm:text-sm"
                >
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-3 sm:px-6 py-10 text-center text-gray-500">
                    Loading leads...
                  </td>
                </tr>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-3 sm:px-6 py-4 font-medium text-gray-800 whitespace-nowrap text-xs sm:text-sm">
                      {lead.name}
                    </td>

                    <td className="px-3 sm:px-6 py-4 text-gray-600 whitespace-nowrap text-xs sm:text-sm">
                      <a
                        href={`mailto:${lead.email}`}
                        className="hover:text-blue-600 transition"
                      >
                        {lead.email}
                      </a>
                    </td>

                    <td className="px-3 sm:px-6 py-4 text-gray-600 whitespace-nowrap text-xs sm:text-sm">
                      {lead.phone}
                    </td>

                    <td className="px-3 sm:px-6 py-4 text-gray-700 max-w-xs text-xs sm:text-sm">
                      <p className="line-clamp-2">{lead.query}</p>
                    </td>

                    <td className="px-3 sm:px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${
                          (lead.status || "").toLowerCase() === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {lead.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-3 sm:px-6 py-10 text-center text-gray-500">
                    {statusFilter === "all"
                      ? "No leads available right now."
                      : `No ${statusFilter} leads right now.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}