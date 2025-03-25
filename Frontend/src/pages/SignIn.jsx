import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LogIn, User, Lock } from 'lucide-react';

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

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.3,
        delayChildren: 0.2,
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex items-center justify-center min-h-screen min-w-screen bg-gradient-to-r from-teal-500 to-cyan-600"
    >
      <motion.div 
        variants={itemVariants}
        className="w-full md:w-[50%] h-full p-8 bg-white rounded-2xl shadow-2xl border-4 border-cyan-100 transform transition duration-300 hover:scale-105"
      >
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold text-center text-cyan-600 mb-6"
        >
          Welcome Back!
        </motion.h2>
        
        <form onSubmit={handleSignIn} className="space-y-4">
          <motion.div variants={itemVariants}>
            <label className="text-gray-700 font-medium flex items-center">
              <User className="mr-2 text-cyan-500" size={20} />
              Email
            </label>
            <motion.input
              variants={itemVariants}
              whileFocus={{ 
                scale: 1.01,
                boxShadow: "0 0 0 3px rgba(20, 184, 166, 0.5)"
              }}
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <label className="text-gray-700 font-medium flex items-center">
              <Lock className="mr-2 text-cyan-500" size={20} />
              Password
            </label>
            <motion.input
              variants={itemVariants}
              whileFocus={{ 
                scale: 1.01,
                boxShadow: "0 0 0 3px rgba(20, 184, 166, 0.5)"
              }}
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </motion.div>
          
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold py-3 rounded-lg hover:from-teal-600 hover:to-cyan-700 transition duration-300 flex items-center justify-center"
          >
            <LogIn className="mr-2" size={20} /> Sign In
          </motion.button>
        </form>
        
        <motion.p 
          variants={itemVariants}
          className="text-gray-500 text-center mt-4"
        >
          Don't have an account?{" "}
          <motion.a 
            whileHover={{ color: "#0891b2" }}
            href="/" 
            className="text-cyan-600 font-semibold hover:underline"
          >
            Sign Up
          </motion.a>
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default SignIn;