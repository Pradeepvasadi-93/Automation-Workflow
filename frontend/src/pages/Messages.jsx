import { useEffect, useState } from "react";
import api from "../utils/api";

const getStatusClasses = (status = "") => {
  const value = status.toLowerCase();
  if (value === "sent") return "bg-green-100 text-green-700";
  if (value === "failed") return "bg-red-100 text-red-700";
  if (value === "pending" || value === "pending_approval") {
    return "bg-yellow-100 text-yellow-700";
  }
  return "bg-blue-100 text-blue-700";
};

const getChannelClasses = (channel = "") => {
  const value = channel.toLowerCase();
  if (value === "email") return "bg-blue-100 text-blue-700";
  if (value === "whatsapp") return "bg-green-100 text-green-700";
  if (value === "sms") return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-700";
};

const MESSAGES_CACHE_KEY = "workflow_messages_cache";

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Restore from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem(MESSAGES_CACHE_KEY);
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
      } catch (err) {
        console.error("Failed to parse cached messages:", err);
      }
    }
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get("/messages");
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setMessages(data);
      
      // Persist to localStorage for log book durability
      localStorage.setItem(MESSAGES_CACHE_KEY, JSON.stringify(data));
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error fetching messages:", err);
      // Keep cached data on error instead of clearing
      const cached = localStorage.getItem(MESSAGES_CACHE_KEY);
      if (cached) {
        try {
          setMessages(JSON.parse(cached));
        } catch {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id) => {
    try {
      setRetryingId(id);
      await api.post(`/messages/${id}/retry`);
      await fetchMessages();
    } catch (err) {
      console.error("Error retrying message:", err);
    } finally {
      setRetryingId(null);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  if (loading && messages.length === 0) {
    return <div className="text-gray-500">Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Message Logs</h2>
          <p className="mt-1 text-sm text-gray-500">
            Track all communication history across channels and delivery states. All messages are persisted permanently.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <div className="inline-flex items-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            Total Messages: {messages.length}
          </div>
          
          <button
            onClick={fetchMessages}
            disabled={loading}
            className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          
          {lastRefresh && (
            <p className="text-xs text-gray-500">
              Last updated: {lastRefresh}
            </p>
          )}
        </div>
      </div>

      {messages.length > 0 ? (
        <ul className="space-y-4">
          {messages.map((message) => {
            const leadName = message.leadId?.name || "Unknown Lead";
            const messageStatus = message.status || "unknown";
            const messageChannel = message.channel || "unknown";

            return (
              <li
                key={message._id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-gray-800">
                        {leadName}
                      </h3>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getChannelClasses(
                          messageChannel
                        )}`}
                      >
                        {messageChannel}
                      </span>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                          messageStatus
                        )}`}
                      >
                        {messageStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
                      <p>
                        <span className="font-medium text-gray-700">Lead:</span>{" "}
                        {leadName}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Message ID:</span>{" "}
                        {message._id}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Sequence:</span>{" "}
                        {message.sequenceId?.name || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Step Order:</span>{" "}
                        {message.stepOrder ?? "N/A"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="mb-2 text-sm font-medium text-gray-700">Content</p>
                      <p className="text-sm leading-6 text-gray-600">
                        {message.content || "No content available"}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 shadow-sm">
          No message logs available right now.
        </div>
      )}
    </div>
  );
}