import { useContext, useEffect, useState } from "react";
import { FlowContext } from "../context/FlowContext";

const API_BASE = "http://localhost:5000/api";

const getChannelClasses = (channel = "") => {
  const value = channel.toLowerCase();

  if (value === "email") return "bg-blue-100 text-blue-700";
  if (value === "whatsapp") return "bg-green-100 text-green-700";
  if (value === "sms") return "bg-purple-100 text-purple-700";

  return "bg-gray-100 text-gray-700";
};

export default function Sequences() {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSequenceId, setOpenSequenceId] = useState(null);

  const [sequenceForm, setSequenceForm] = useState({
    name: "",
    description: "",
  });

  const [stepForms, setStepForms] = useState({});

  const [lifecycleLoading, setLifecycleLoading] = useState({
    id: null,
    action: null,
  });

  const { selectedSequenceId, setSelectedSequenceId } = useContext(FlowContext);

  const toggleDetails = (id) => {
    setOpenSequenceId((prev) => (prev === id ? null : id));
  };

  const fetchSequences = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/sequences/get`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setSequences(data);
      } else if (Array.isArray(data.data)) {
        setSequences(data.data);
      } else {
        setSequences([]);
      }
    } catch (error) {
      console.error("Error fetching sequences:", error);
      setSequences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSequences();
  }, []);

  const handleCreateSequence = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/sequences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: sequenceForm.name,
          description: sequenceForm.description,
          steps: [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create sequence");
      }

      setSequenceForm({ name: "", description: "" });
      fetchSequences();
    } catch (error) {
      console.error("Error creating sequence:", error.message);
    }
  };

  const handleLifecycle = async (id, action) => {
    try {
      setLifecycleLoading({ id, action });

      const res = await fetch(`${API_BASE}/sequences/${id}/${action}`, {
        method: "POST",
      });

      const data = await res.json();
      console.log("lifecycle:", data);

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} sequence`);
      }

      setSequences((prev) =>
        prev.map((seq) => (seq._id === id ? data.sequence || seq : seq))
      );
    } catch (error) {
      console.error(`Error trying to ${action} sequence:`, error.message);
    } finally {
      setLifecycleLoading({ id: null, action: null });
    }
  };

  const handleStepInputChange = (sequenceId, field, value) => {
    setStepForms((prev) => ({
      ...prev,
      [sequenceId]: {
        ...prev[sequenceId],
        [field]: value,
      },
    }));
  };

  const handleAddStep = async (sequenceId, stepsLength) => {
    const form = stepForms[sequenceId] || {};

    try {
      const res = await fetch(`${API_BASE}/sequences/${sequenceId}/steps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order: Number(form.order) || stepsLength + 1,
          channel: form.channel || "email",
          message: form.message || "",
          trigger: {
            type: "timeDelay",
            delayMinutes: Number(form.delayMinutes) || 0,
            condition: form.condition || "",
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add step");
      }

      setStepForms((prev) => ({
        ...prev,
        [sequenceId]: {
          order: "",
          channel: "email",
          message: "",
          delayMinutes: "",
          condition: "",
        },
      }));

      fetchSequences();
    } catch (error) {
      console.error("Error adding step:", error.message);
    }
  };

  const handleRemoveStep = async (sequenceId, stepId) => {
    try {
      const res = await fetch(
        `${API_BASE}/sequences/${sequenceId}/steps/${stepId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove step");
      }

      setSequences((prev) =>
        prev.map((seq) =>
          seq._id === sequenceId
            ? {
                ...seq,
                steps: seq.steps.filter((step) => step._id !== stepId),
              }
            : seq
        )
      );
    } catch (error) {
      console.error("Error removing step:", error.message);
    }
  };

  const renderSpinner = () => (
    <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sequences</h2>
          <p className="text-sm text-gray-500 mt-1">
            Review automated outreach flows and their follow-up steps.
          </p>

          {selectedSequenceId && (
            <p className="mt-2 text-xs text-violet-700 font-medium">
              Selected Sequence ID: {selectedSequenceId}
            </p>
          )}
        </div>

        <div className="inline-flex items-center rounded-xl bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
          Total Sequences: {sequences.length}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800">Create Sequence</h3>

        <form
          onSubmit={handleCreateSequence}
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          <input
            type="text"
            placeholder="Sequence name"
            value={sequenceForm.name}
            onChange={(e) =>
              setSequenceForm((prev) => ({ ...prev, name: e.target.value }))
            }
            className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
            required
          />

          <input
            type="text"
            placeholder="Description"
            value={sequenceForm.description}
            onChange={(e) =>
              setSequenceForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
          />

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              Create Sequence
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading sequences...</p>
      ) : sequences.length > 0 ? (
        <div className="grid gap-5">
          {sequences.map((seq) => {
            const isOpen = openSequenceId === seq._id;
            const form = stepForms[seq._id] || {
              order: "",
              channel: "email",
              message: "",
              delayMinutes: "",
              condition: "",
            };

            const isStartLoading =
              lifecycleLoading.id === seq._id &&
              lifecycleLoading.action === "start";

            const isPauseLoading =
              lifecycleLoading.id === seq._id &&
              lifecycleLoading.action === "pause";

            const status = seq.status || "draft";
            const isSelected = selectedSequenceId === seq._id;

            return (
              <div
                key={seq._id}
                className={`rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
                  isSelected
                    ? "border-violet-500 ring-2 ring-violet-200"
                    : "border-gray-200"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="selectedSequence"
                      checked={isSelected}
                      onChange={() => setSelectedSequenceId(seq._id)}
                      className="mt-1 h-4 w-4 accent-violet-600"
                    />

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {seq.name}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {seq.steps?.length || 0} step
                        {(seq.steps?.length || 0) !== 1 ? "s" : ""} in this
                        sequence
                      </p>

                      {seq.description ? (
                        <p className="text-sm text-gray-500 mt-1">
                          {seq.description}
                        </p>
                      ) : null}

                      <p className="mt-2 text-xs font-medium text-gray-500">
                        Status:{" "}
                        <span className="capitalize text-gray-700">
                          {status}
                        </span>
                      </p>

                      {isSelected && (
                        <p className="mt-2 text-xs font-semibold text-violet-700">
                          This sequence is selected
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleDetails(seq._id)}
                      aria-expanded={isOpen}
                      aria-controls={`sequence-details-${seq._id}`}
                      className="w-fit rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                    >
                      {isOpen ? "Hide Details" : "View Details"}
                    </button>

                    <button
                      onClick={() => handleLifecycle(seq._id, "start")}
                      disabled={isStartLoading || isPauseLoading}
                      className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white ${
                        status === "active"
                          ? "bg-green-700"
                          : "bg-green-600 hover:bg-green-700"
                      } disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                      {isStartLoading
                        ? "Starting..."
                        : status === "active"
                        ? "Started"
                        : "Start"}
                      {isStartLoading && renderSpinner()}
                    </button>

                    <button
                      onClick={() => handleLifecycle(seq._id, "pause")}
                      disabled={isStartLoading || isPauseLoading}
                      className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white ${
                        status === "paused"
                          ? "bg-yellow-600"
                          : "bg-yellow-500 hover:bg-yellow-600"
                      } disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                      {isPauseLoading
                        ? "Pausing..."
                        : status === "paused"
                        ? "Paused"
                        : "Pause"}
                      {isPauseLoading && renderSpinner()}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div
                    id={`sequence-details-${seq._id}`}
                    className="mt-6 space-y-6"
                  >
                    <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
                      {seq.steps?.length > 0 ? (
                        seq.steps.map((step, index) => (
                          <div
                            key={step._id || step.order}
                            className="flex gap-4"
                          >
                            <div className="flex flex-col items-center">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                                {step.order}
                              </div>

                              {index !== seq.steps.length - 1 && (
                                <div className="mt-2 h-full w-0.5 bg-gray-200" />
                              )}
                            </div>

                            <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getChannelClasses(
                                      step.channel
                                    )}`}
                                  >
                                    {step.channel}
                                  </span>

                                  <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                                    Delay: {step.trigger?.delayMinutes ?? 0} mins
                                  </span>

                                  {step.aiDraft && (
                                    <span className="inline-flex rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
                                      AI Draft
                                    </span>
                                  )}

                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                      step.approved
                                        ? "bg-green-100 text-green-700"
                                        : "bg-yellow-100 text-yellow-700"
                                    }`}
                                  >
                                    {step.approved
                                      ? "Approved"
                                      : "Pending Approval"}
                                  </span>
                                </div>

                                {step._id && (
                                  <button
                                    onClick={() =>
                                      handleRemoveStep(seq._id, step._id)
                                    }
                                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>

                              <p className="mt-3 text-sm leading-6 text-gray-700">
                                {step.message}
                              </p>

                              {step.trigger?.condition ? (
                                <p className="mt-2 text-xs text-gray-500">
                                  Condition: {step.trigger.condition}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                          No steps added yet.
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 pt-4 rounded-2xl border bg-white p-4">
                      <h4 className="text-sm font-semibold text-gray-800">
                        Add Step
                      </h4>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <select
                          value={form.channel}
                          onChange={(e) =>
                            handleStepInputChange(
                              seq._id,
                              "channel",
                              e.target.value
                            )
                          }
                          className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="email">Email</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="sms">SMS</option>
                        </select>

                        <input
                          type="number"
                          placeholder="Delay in minutes"
                          value={form.delayMinutes}
                          onChange={(e) =>
                            handleStepInputChange(
                              seq._id,
                              "delayMinutes",
                              e.target.value
                            )
                          }
                          className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        />

                        <input
                          type="text"
                          placeholder="Condition (optional)"
                          value={form.condition}
                          onChange={(e) =>
                            handleStepInputChange(
                              seq._id,
                              "condition",
                              e.target.value
                            )
                          }
                          className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 md:col-span-2"
                        />

                        <textarea
                          placeholder="Step message"
                          value={form.message}
                          onChange={(e) =>
                            handleStepInputChange(
                              seq._id,
                              "message",
                              e.target.value
                            )
                          }
                          className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 md:col-span-2"
                          rows={4}
                          required
                        />

                        <div className="md:col-span-2">
                          <button
                            onClick={() =>
                              handleAddStep(seq._id, seq.steps?.length || 0)
                            }
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                          >
                            Add Step
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 shadow-sm">
          No sequences available right now.
        </div>
      )}
    </div>
  );
}