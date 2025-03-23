import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/signin", { email, password });
      localStorage.setItem("token", response.data.token);
      alert("Login successful!");
      navigate("/chat");
    } catch (error) {
      alert("Login failed. Try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen min-w-screen bg-gradient-to-r from-purple-500 to-indigo-600">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl transform transition duration-300 hover:scale-105">
        <h2 className="text-3xl font-extrabold text-center text-indigo-600 mb-6">Welcome Back!</h2>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-500 text-white font-bold py-3 rounded-lg hover:bg-indigo-600 transition duration-300"
          >
            Sign In
          </button>
        </form>
        <p className="text-gray-500 text-center mt-4">
          Don't have an account?{" "}
          <a href="/" className="text-indigo-600 font-semibold hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
