import { useContext, useEffect } from "react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";
import { FlowContext } from "../context/FlowContext";

export default function Overview() {
  const {
    leadsCount,
    draftsCount,
    sequencesCount,
    loading,
  } = useContext(FlowContext);

  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    gsap.fromTo(
      ".stat-card",
      {
        autoAlpha: 0,
        y: 40,
        scale: 0.92,
        rotateX: 8,
        transformOrigin: "top center",
        filter: "blur(10px)",
      },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        filter: "blur(0px)",
        duration: 1,
        ease: "power3.out",
        stagger: 0.1,
      }
    );
  }, [loading]);

  if (loading) {
    return <p className="text-gray-500">Loading dashboard...</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-10">Overview Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          onClick={() => navigate("/leads")}
          className="stat-card bg-white p-6 rounded shadow hover:shadow-lg transition cursor-pointer"
        >
          <h3>Leads</h3>
          <p className="text-3xl font-bold text-blue-600">{leadsCount}</p>
        </div>

        <div
          onClick={() => navigate("/drafts")}
          className="stat-card bg-white p-6 rounded shadow hover:shadow-lg transition cursor-pointer"
        >
          <h3>Drafts</h3>
          <p className="text-3xl font-bold text-green-600">{draftsCount}</p>
        </div>

        <div
          onClick={() => navigate("/messages")}
          className="stat-card bg-white p-6 rounded shadow hover:shadow-lg transition cursor-pointer"
        >
          <h3>Messages</h3>
          <p className="text-3xl font-bold text-purple-600">0</p>
        </div>

        <div
          onClick={() => navigate("/sequences")}
          className="stat-card bg-white p-6 rounded shadow hover:shadow-lg transition cursor-pointer"
        >
          <h3>Sequences</h3>
          <p className="text-3xl font-bold text-red-600">{sequencesCount}</p>
        </div>
      </div>
    </div>
  );
}