import { useState, useEffect, useContext } from "react";
import { FlowContext } from "../context/FlowContext"; // adjust path

const getStatusClasses = (status = "") => {
  const value = status.toLowerCase();

  if (value === "approved") return "bg-green-100 text-green-700";
  if (value === "rejected") return "bg-red-100 text-red-700";
  if (value === "sent") return "bg-blue-100 text-blue-700";
  return "bg-yellow-100 text-yellow-700";
};

export default function Drafts() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [editedResponse, setEditedResponse] = useState("");

  // NEW: read selected sequence from FlowContext
  const { selectedSequenceId } = useContext(FlowContext);
  console.log("Selected sequence ID from context:", selectedSequenceId);

  const openModal = (draft) => {
    setSelectedDraft(draft);
    setEditedResponse(draft.draft_response || "");
  };

  const closeModal = () => {
    setSelectedDraft(null);
    setEditedResponse("");
  };

  const handleSave = () => {
    if (!selectedDraft) return;

    setDrafts((prevDrafts) =>
      prevDrafts.map((draft) =>
        draft._id === selectedDraft._id
          ? { ...draft, draft_response: editedResponse }
          : draft
      )
    );

    setSelectedDraft((prev) =>
      prev ? { ...prev, draft_response: editedResponse } : null
    );
  };

  // NEW: helper to call assign-lead API
  const assignLeadToSequence = async (leadId) => {
    if (!selectedSequenceId) {
      console.warn("No sequence selected. Cannot assign lead to sequence.");
      return;
    }
    if (!leadId) {
      console.warn("No leadId on draft. Cannot assign lead to sequence.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/sequences/assign-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sequenceId: selectedSequenceId,
          leadId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "Failed to assign lead to sequence:",
          data.error || data.message
        );
      } else {
        console.log("Lead assigned to sequence:", data);
      }
    } catch (error) {
      console.error("Error assigning lead to sequence:", error);
    }
  };

  const handleUpdateStatus = async (id, status) => {
  try {
    if (status === "APPROVED" && !selectedSequenceId) {
      alert("Please select a sequence before approving the draft.");
      return;
    }

    const res = await fetch(`http://localhost:5000/draft/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        approved_by: "admin",
      }),
    });

    const data = await res.json();

    if (data.success) {
      setDrafts((prevDrafts) =>
        prevDrafts.map((draft) =>
          draft._id === id ? { ...draft, ...data.data } : draft
        )
      );

      if (selectedDraft && selectedDraft._id === id) {
        setSelectedDraft((prev) =>
          prev ? { ...prev, ...data.data } : null
        );
      }

      if (status === "APPROVED") {
        const existingDraft = drafts.find((d) => d._id === id);
        const updatedDraft = data.data || existingDraft || selectedDraft;

        const leadId =
          updatedDraft?.lead_id ||
          updatedDraft?.leadId ||
          updatedDraft?.lead?._id ||
          updatedDraft?.lead;

        if (!leadId) {
          console.warn("Lead id not found on draft.");
          return;
        }

        const assignRes = await fetch("http://localhost:5000/api/sequences/assign-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sequenceId: selectedSequenceId,
            leadId,
          }),
        });

        const assignData = await assignRes.json();

        if (!assignRes.ok) {
          console.error(
            "Failed to assign lead to sequence:",
            assignData.error || assignData.message
          );
        }
      }
    } else {
      console.error("Failed to update draft:", data.message);
    }
  } catch (error) {
    console.error("Error updating draft:", error);
  }
};

  const handleReject = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/draft/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          approved_by: "admin",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setDrafts((prevDrafts) =>
          prevDrafts.map((draft) =>
            draft._id === id
              ? { ...draft, ...data.data, showRejectedActions: true }
              : draft
          )
        );

        if (selectedDraft && selectedDraft._id === id) {
          setSelectedDraft((prev) =>
            prev ? { ...prev, ...data.data, showRejectedActions: true } : null
          );
        }
      } else {
        console.error("Failed to reject draft:", data.message);
      }
    } catch (error) {
      console.error("Error rejecting draft:", error);
    }
  };

  const handleRemove = (id) => {
    setDrafts((prevDrafts) => prevDrafts.filter((draft) => draft._id !== id));

    if (selectedDraft && selectedDraft._id === id) {
      closeModal();
    }
  };

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const res = await fetch("http://localhost:5000/draft/get");
        const data = await res.json();

        const draftList = (data.data || []).map((draft) => ({
          ...draft,
          showRejectedActions: false,
        }));

        setDrafts(draftList);
      } catch (error) {
        console.error("Error fetching drafts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, []);

  const visibleDrafts = drafts.filter(
    (draft) => !(draft.status === "REJECTED" && !draft.showRejectedActions)
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Drafts</h2>
          <p className="text-sm text-gray-500 mt-1">
            Review AI-generated responses before approval or sending.
          </p>
        </div>

        <div className="inline-flex items-center rounded-xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
          Total Drafts: {visibleDrafts.length}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading drafts...</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-212.5 text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-600">Lead</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">
                    Draft Response
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {visibleDrafts.length > 0 ? (
                  visibleDrafts.map((draft) => (
                    <tr key={draft._id} className="hover:bg-gray-50">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-gray-800">
                          {draft.lead_name || "Unknown Lead"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Draft ID: {draft._id}
                        </p>
                      </td>

                      <td className="px-6 py-5 max-w-xl">
                        <button
                          type="button"
                          onClick={() => openModal(draft)}
                          className="text-left w-full"
                        >
                          <p className="text-gray-700 truncate max-w-xs">
                            {draft.draft_response}
                          </p>
                          <span className="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline">
                            View full response
                          </span>
                        </button>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                            draft.status
                          )}`}
                        >
                          {draft.status}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {draft.status === "WAITING_APPROVAL" && (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(draft._id, "APPROVED")
                                }
                                className="rounded-lg bg-green-600 px-3 py-2 text-xs text-white hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(draft._id)}
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs text-white hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {draft.status === "APPROVED" && (
                            <>
                              <button
                                disabled
                                className="rounded-lg bg-green-500 px-3 py-2 text-xs text-white cursor-default"
                              >
                                Approved
                              </button>
                            </>
                          )}

                          {draft.status === "REJECTED" &&
                            draft.showRejectedActions && (
                              <>
                                <button
                                  disabled
                                  className="rounded-lg bg-red-500 px-3 py-2 text-xs text-white cursor-default"
                                >
                                  Rejected
                                </button>
                                <button
                                  onClick={() => handleRemove(draft._id)}
                                  className="rounded-lg bg-gray-600 px-3 py-2 text-xs text-white hover:bg-gray-700"
                                >
                                  Remove
                                </button>
                              </>
                            )}

                          {draft.status === "SENT" && (
                            <button
                              disabled
                              className="rounded-lg bg-blue-500 px-3 py-2 text-xs text-white cursor-default"
                            >
                              Sent
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No drafts available at the moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedDraft && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Draft for {selectedDraft.lead_name || "Lead"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Draft ID: {selectedDraft._id}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Close
              </button>
            </div>

            <div className="mt-4">
              <label
                htmlFor="draft-response"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Edit response
              </label>

              <textarea
                id="draft-response"
                value={editedResponse}
                onChange={(e) => setEditedResponse(e.target.value)}
                rows={12}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-sm leading-7 text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}