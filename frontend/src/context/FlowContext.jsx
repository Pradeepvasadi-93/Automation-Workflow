import { createContext, useState, useEffect } from "react";

export const FlowContext = createContext();

const API_BASE = "http://localhost:5000";

export default function FlowProvider({ children }) {
  const [leadsCount, setLeadsCount] = useState(0);
  const [draftsCount, setDraftsCount] = useState(0);
  const [sequencesCount, setSequencesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // NEW: selected sequence id for use across pages
  const [selectedSequenceId, setSelectedSequenceId] = useState(null);

  const fetchCounts = async () => {
    try {
      setLoading(true);

      const [leadsRes, draftsRes, sequencesRes] = await Promise.all([
        fetch(`${API_BASE}/lead/get`),
        fetch(`${API_BASE}/draft/get`),
        fetch(`${API_BASE}/api/sequences/get`),
      ]);

      const leadsData = await leadsRes.json();
      const draftsData = await draftsRes.json();
      const sequencesData = await sequencesRes.json();

      const leadsArray = Array.isArray(leadsData)
        ? leadsData
        : leadsData.leads || [];

      const draftsArray = Array.isArray(draftsData)
        ? draftsData
        : draftsData.data || [];

      const sequencesArray = Array.isArray(sequencesData)
        ? sequencesData
        : sequencesData.data || [];

      setLeadsCount(leadsArray.length);
      setDraftsCount(draftsArray.length);
      setSequencesCount(sequencesArray.length);
    } catch (error) {
      console.error("Error fetching counts:", error);
      setLeadsCount(0);
      setDraftsCount(0);
      setSequencesCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return (
    <FlowContext.Provider
      value={{
        leadsCount,
        setLeadsCount,
        draftsCount,
        setDraftsCount,
        sequencesCount,
        setSequencesCount,
        loading,
        refreshCounts: fetchCounts,

        // NEW
        selectedSequenceId,
        setSelectedSequenceId,
      }}
    >
      {children}
    </FlowContext.Provider>
  );
}