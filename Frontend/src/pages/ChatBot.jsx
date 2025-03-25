import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Search, CheckCircle2, XCircle } from 'lucide-react';

const ChatBot = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [fileSearchEnabled, setFileSearchEnabled] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, generatingAnswer]);

  async function generateAnswer(e) {
    e.preventDefault();
    if (!question.trim()) return;

    setGeneratingAnswer(true);
    const currentQuestion = question;
    setQuestion("");

    setChatHistory((prev) => [
      ...prev,
      { type: "question", content: currentQuestion },
    ]);

    try {
      const response = await axios.post("http://localhost:5000/api/chat", {
        protocol: "mcp",
        version: "1.0",
        module: "chat",
        context_id: "user123",
        fileSearch: fileSearchEnabled,
        data: {
          user_message: currentQuestion,
          contents: [{ parts: [{ text: currentQuestion }] }]
        },
      });

      const aiResponse = response.data.data.response;
      setChatHistory((prev) => [
        ...prev,
        { type: "answer", content: aiResponse },
      ]);
    } catch (error) {
      console.error("Error details:", error.response?.data || error.message);
      setChatHistory((prev) => [
        ...prev,
        {
          type: "answer",
          content: "Sorry - Something went wrong. Please try again!",
        },
      ]);
    }
    setGeneratingAnswer(false);
  }

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

  const messageVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 20 
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="fixed inset-0 bg-gradient-to-r from-teal-500 to-cyan-600 flex flex-col items-center justify-center p-4"
    >
      {/* Chat Container */}
      <motion.div 
        variants={itemVariants}
        className="w-full max-w-3xl h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border-4 border-cyan-100"
      >
        {/* Header */}
        <motion.header 
          variants={itemVariants}
          className="text-center p-4 border-b bg-gradient-to-r from-teal-500 to-cyan-600 rounded-t-2xl flex items-center justify-between"
        >
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-white flex-grow text-center"
          >
            Chat AI
          </motion.h1>
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Search color="white" size={24} />
          </motion.div>
        </motion.header>

        {/* Chat Messages */}
        <motion.div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 hide-scrollbar bg-gray-50"
        >
          <AnimatePresence>
            {chatHistory.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col items-center justify-center text-center p-6"
              >
                <motion.div 
                  variants={itemVariants}
                  className="bg-cyan-50 rounded-xl p-6 max-w-lg shadow-lg"
                >
                  <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl font-bold text-cyan-600 mb-3"
                  >
                    Welcome to Chat AI! 👋
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-700"
                  >
                    Ask me anything! I can help with:
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-500 mt-4 text-sm"
                  >
                    Type your question below and press Enter!
                  </motion.p>
                </motion.div>
              </motion.div>
            ) : (
              chatHistory.map((chat, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  animate="visible"
                  variants={messageVariants}
                  className={`flex ${
                    chat.type === "question" ? "justify-end" : "justify-start"
                  } mb-3`}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`max-w-[75%] p-3 rounded-lg shadow-md ${
                      chat.type === "question"
                        ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                    }`}
                  >
                    <ReactMarkdown>{chat.content}</ReactMarkdown>
                  </motion.div>
                </motion.div>
              ))
            )}

            {generatingAnswer && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-left"
              >
                <motion.div 
                  animate={{ 
                    scale: [1, 1.05, 1],
                    transition: { 
                      repeat: Infinity, 
                      duration: 1 
                    }
                  }}
                  className="inline-block bg-cyan-100 text-cyan-800 p-3 rounded-lg"
                >
                  Thinking...
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Input Box */}
        <motion.form
          variants={itemVariants}
          onSubmit={generateAnswer}
          className="p-4 bg-gray-100 rounded-b-2xl"
        >
          <div className="flex items-center space-x-2">
            <motion.textarea
              variants={itemVariants}
              whileFocus={{ 
                scale: 1.01,
                boxShadow: "0 0 0 3px rgba(20, 184, 166, 0.5)"
              }}
              className="bg-white flex-1 p-3 border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your message..."
              rows="2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  generateAnswer(e);
                }
              }}
              required
            ></motion.textarea>

            <motion.label 
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white border border-gray-300 rounded-lg p-2 flex items-center space-x-2 cursor-pointer"
            >
              <span className="text-gray-700">File Search</span>
              <motion.div 
                animate={{
                  scale: fileSearchEnabled ? [1, 1.2, 1] : 1,
                }}
              >
                {fileSearchEnabled ? (
                  <CheckCircle2 color="green" size={20} />
                ) : (
                  <XCircle color="red" size={20} />
                )}
              </motion.div>
              <input
                type="checkbox"
                className="hidden"
                checked={fileSearchEnabled}
                onChange={() => setFileSearchEnabled(!fileSearchEnabled)}
              />
            </motion.label>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className={`px-5 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-colors flex items-center ${
                generatingAnswer ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={generatingAnswer}
            >
              <Send size={20} className="mr-2" /> Send
            </motion.button>
          </div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
};

export default ChatBot;