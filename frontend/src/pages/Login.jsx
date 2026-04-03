import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const container = useRef();

  useGSAP(() => {
    const tl = gsap.timeline();

    tl.from(".login-card", {
      opacity: 0,
      y: 40,
      scale: 0.96,
      duration: 0.9,
      ease: "power3.out",
    })
      .from(
        ".login-title",
        {
          opacity: 0,
          y: 16,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.4"
      )
      .from(
        ".login-field",
        {
          opacity: 0,
          y: 18,
          duration: 0.5,
          stagger: 0.12,
          ease: "power2.out",
        },
        "-=0.25"
      )
      .from(
        ".login-button",
        {
          opacity: 0,
          y: 14,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.2"
      );
  }, { scope: container });

  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.username.trim() || !form.password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    if (form.username === "admin" && form.password === "admin123") {
      navigate("/overview");
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <div
      ref={container}
      className="relative min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-gray-900 to-slate-800 px-4"
    >
      {/* Top-right Contact Us button */}
      <Link to="/form">
        <button className="absolute top-5 right-5 m-3 inline-flex items-center rounded-full border-2 border-white/80 px-4 py-2 text-sm font-semibold text-white bg-transparent hover:shadow-amber-50 hover:bg-white/10 transition"
>
          Contact Us
        </button>
      </Link>

      <div className="login-card w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl border border-white/20 p-8">
        <div className="login-title text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Admin Login</h2>
          <p className="text-sm text-gray-500 mt-2">
            Sign in to access your dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="login-field">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your username"
              autoComplete="username"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div className="login-field">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-20 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-field rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button w-full rounded-xl bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 active:scale-[0.99] transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}