import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:5000/api";

const getChannelClasses = (channel = "") => {
  const value = String(channel).toLowerCase();

  if (value === "email") return "bg-blue-100 text-blue-700 border-blue-200";
  if (value === "sms") return "bg-purple-100 text-purple-700 border-purple-200";
  if (value === "whatsapp") return "bg-green-100 text-green-700 border-green-200";

  return "bg-gray-100 text-gray-700 border-gray-200";
};

const getChannelLabel = (channel = "") => {
  const value = String(channel).toLowerCase();
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getTriggerLabel = (trigger) => {
  if (!trigger) return "No trigger";

  if (typeof trigger === "string") {
    return trigger.replaceAll("_", " ");
  }

  if (typeof trigger === "object") {
    const type = trigger.type || "timeDelay";
    const delay = trigger.delayMinutes ?? 0;
    const condition = trigger.condition?.trim();

    if (type === "timeDelay") {
      if (condition) return `After ${delay} min • ${condition}`;
      return `After ${delay} min`;
    }

    return `${type}${condition ? ` • ${condition}` : ""}`;
  }

  return "No trigger";
};

// API now returns a flat array of pending approval steps
const formatApprovalData = (data) => {
  const steps = Array.isArray(data) ? data : data?.data || [];

  return steps.map((step) => ({
    _id: step.stepId || step._id,
    sequenceId: step.sequenceId,
    sequenceName: step.sequenceName || "Untitled Sequence",
    sequenceDescription: step.sequenceDescription || "",
    channel: step.channel,
    message: step.message,
    trigger: step.trigger,
    order: step.order,
    approved: step.approved,
    aiDraft: step.aiDraft,
    status: step.status || "PENDING_APPROVAL",
    leadName: step.leadName || step.lead?.name || "",
  }));
};

export default function ApprovalPage() {
  const [pendingSteps, setPendingSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [error, setError] = useState("");

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/approvals`);
      const data = await res.json();
      console.log("Raw approval data from API:", data);

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch approvals");
      }

      const flattenedSteps = formatApprovalData(data);
      console.log("Flattened approvals:", flattenedSteps);
      setPendingSteps(flattenedSteps);
    } catch (err) {
      console.error("Error fetching approvals:", err);
      setError(err.message || "Something went wrong while loading approvals");
      setPendingSteps([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (stepId) => {
    try {
      setApprovingId(stepId);

      const res = await fetch(`${API_BASE}/approvals/${stepId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Approval failed");
      }

      setPendingSteps((prev) => prev.filter((step) => step._id !== stepId));
    } catch (err) {
      console.error("Error approving draft:", err);
      alert(err.message || "Failed to approve draft");
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const groupedBySequence = useMemo(() => {
    const groups = new Map();

    for (const step of pendingSteps) {
      if (!groups.has(step.sequenceId)) {
        groups.set(step.sequenceId, {
          sequenceId: step.sequenceId,
          sequenceName: step.sequenceName,
          sequenceDescription: step.sequenceDescription,
          steps: [],
        });
      }
      groups.get(step.sequenceId).steps.push(step);
    }

    return Array.from(groups.values());
  }, [pendingSteps]);

  const showLoading = loading;
  const showError = !loading && !!error;
  const showEmpty = !loading && !error && pendingSteps.length === 0;
  const showList = !loading && !error && pendingSteps.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-4">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* Header (smaller padding + font sizes) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                Human Review Queue
              </p>
              <h1 className="mt-1 text-xl font-bold text-gray-900 md:text-2xl">
                Pending Approvals
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-gray-500 md:text-sm">
                Review AI-generated sequence steps grouped by sequence before they
                are approved for outreach across email, SMS, and WhatsApp.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-amber-700">
                  Steps Waiting Approval
                </p>
                <p className="mt-0.5 text-xl font-bold text-amber-800">
                  {pendingSteps.length}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                  Sequences With Pending Steps
                </p>
                <p className="mt-0.5 text-lg font-bold text-gray-800">
                  {groupedBySequence.length}
                </p>
              </div>

              <button
                onClick={fetchPendingApprovals}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {showLoading && (
          <div className="grid gap-3">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="h-4 w-40 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-56 rounded bg-gray-200" />
                <div className="mt-3 h-16 rounded-xl bg-gray-100" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {showError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
            <h2 className="text-sm font-semibold">Unable to load approvals</h2>
            <p className="mt-1 text-xs">{error}</p>
            <button
              onClick={fetchPendingApprovals}
              className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {showEmpty && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl">
              ✅
            </div>
            <h2 className="mt-3 text-lg font-semibold text-gray-800">
              No pending approvals
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              All AI-drafted sequence steps have been reviewed, or there are no
              draft steps waiting for approval right now.
            </p>
          </div>
        )}

        {/* Grouped list by sequence */}
        {showList && (
          <div className="space-y-3">
            {groupedBySequence.map((group) => (
              <div
                key={group.sequenceId}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                {/* Sequence header */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {group.sequenceName}
                    </h2>
                    {group.sequenceDescription && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {group.sequenceDescription}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] font-medium text-gray-500">
                      Sequence ID:{" "}
                      <span className="break-all text-gray-700">
                        {group.sequenceId}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                      {group.steps.length} step
                      {group.steps.length !== 1 ? "s" : ""} pending
                    </span>
                  </div>
                </div>

                {/* Steps inside this sequence */}
                <div className="mt-3 space-y-2.5">
                  {group.steps
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((step) => (
                      <div
                        key={step._id}
                        className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 md:flex-row md:items-start md:justify-between"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">
                              {step.order ?? "-"}
                            </span>

                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getChannelClasses(
                                step.channel
                              )}`}
                            >
                              {getChannelLabel(step.channel)}
                            </span>

                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-[11px] font-semibold text-yellow-700">
                              Pending
                            </span>

                            {step.aiDraft && (
                              <span className="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-0.5 text-[11px] font-semibold text-pink-700">
                                AI Draft
                              </span>
                            )}
                          </div>

                          {step.leadName && (
                            <p className="text-[11px] font-medium text-gray-600">
                              Lead:{" "}
                              <span className="font-semibold text-gray-800">
                                {step.leadName}
                              </span>
                            </p>
                          )}

                          <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 md:grid-cols-2">
                            <div>
                              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                                Trigger
                              </p>
                              <p className="mt-0.5 font-medium text-gray-700">
                                {getTriggerLabel(step.trigger)}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                                Status
                              </p>
                              <p className="mt-0.5 font-medium text-gray-700">
                                Pending Approval
                              </p>
                            </div>
                          </div>

                          <div className="rounded-lg border border-gray-200 bg-white p-2.5">
                            <p className="mb-0.5 text-[11px] font-semibold text-gray-700">
                              Draft Message
                            </p>
                            <p className="whitespace-pre-wrap text-xs leading-5 text-gray-700">
                              {step.message || "No message content"}
                            </p>
                          </div>
                        </div>

                        <div className="flex w-full shrink-0 flex-row gap-1.5 md:w-32 md:flex-col">
                          <button
                            onClick={() => handleApprove(step._id)}
                            disabled={approvingId === step._id}
                            className="w-full rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {approvingId === step._id ? "Approving..." : "Approve"}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}