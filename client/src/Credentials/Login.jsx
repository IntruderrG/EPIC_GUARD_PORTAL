import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [type, setType] = useState(""); // "error" | "success"
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({ ...form, [name]: value });

    if (name === "email") {
      if (!validateEmail(value)) {
        setEmailError("Invalid email format");
      } else {
        setEmailError("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("https://epic.akiyaa.online/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setType("error");
        setMessage(data.msg || "AUTHENTICATION FAILED");
        setLoading(false);
        return;
      }

      // ✅ SUCCESS
      setType("success");
      setMessage("ACCESS GRANTED • REDIRECTING");

      setUser(data.user);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      console.error(err);
      setType("error");
      setMessage("SERVER ERROR");
      setLoading(false);
    }
  };

  // 🔄 Auto-hide message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-zinc-800 rounded-2xl p-8 bg-zinc-950">
        {/* Title */}
        <h1
          className="text-yellow-400 font-black mb-6 text-center"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "32px",
            letterSpacing: "1px",
          }}
        >
          GUARD LOGIN
        </h1>

        {/* 🔔 Message Panel */}
        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              type === "error" ?
                "bg-red-500/10 border border-red-500/30 text-red-400"
              : "bg-green-500/10 border border-green-500/30 text-green-400"
            }`}
          >
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className={`bg-black border outline-none px-4 py-3 rounded-lg text-sm ${
              emailError ?
                "border-red-500 focus:border-red-500"
              : "border-zinc-700 focus:border-yellow-400"
            }`}
          />
          {emailError && (
            <p className="text-red-400 text-xs mt-1">{emailError}</p>
          )}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="bg-black border border-zinc-700 focus:border-yellow-400 outline-none px-4 py-3 rounded-lg text-sm"
          />

          <button
            type="submit"
            disabled={loading}
            className={`font-bold py-3 rounded-lg mt-2 transition-all duration-200 ${
              loading ?
                "bg-yellow-300 text-black opacity-70 cursor-not-allowed"
              : "bg-yellow-400 hover:bg-yellow-300 text-black"
            }`}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "1px",
            }}
          >
            {loading ? "AUTHENTICATING..." : "ENTER SYSTEM"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-zinc-500 text-sm text-center mt-6">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}
