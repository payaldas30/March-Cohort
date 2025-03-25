import React from "react";

const LandingPage = () => {
  //   const handleOAuthLogin = () => {
  //     // Redirect to your OAuth provider URL
  //     window.location.href = "http://localhost:5000/auth/google"; // Replace with your OAuth endpoint
  //   };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-400 to-indigo-600 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-white mb-6">
        Welcome to Chat AI 🤖
      </h1>
      <p className="text-lg text-white text-center max-w-2xl mb-8">
        Unlock the power of AI. Our chatbot can answer your questions, search
        through files, and assist you in your tasks. Experience intelligent
        conversations like never before.
      </p>

      <a href="https://march-cohort.onrender.com/auth/google">
        <button
          // onClick={handleOAuthLogin}
          className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg shadow-lg hover:bg-gray-200 transition"
        >
          Try Chat Bot
        </button>
      </a>

      <div className="mt-12 text-center text-white max-w-xl">
        <h2 className="text-2xl font-bold mb-4">About Us</h2>
        <p>
          We are a team passionate about AI, NLP, and creating intuitive user
          experiences. Our chatbot is designed to assist you by not only
          answering questions but also searching through your files
          intelligently.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
