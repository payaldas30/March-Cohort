import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const ChatBot = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, generatingAnswer]);

  async function generateAnswer(e) {
    e.preventDefault();
    if (!question.trim()) return;

    setGeneratingAnswer(true);
    const currentQuestion = question;
    setQuestion("");

    setChatHistory((prev) => [...prev, { type: "question", content: currentQuestion }]);

    try {
      // const response = await axios({
      //   url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAYMP-D54ty2tRR4MlVVNgwOZ_8IHJE_dk",
      //   method: "post",
      //   data: { contents: [{ parts: [{ text: question }] }] },
      // });

      const response = await axios.post('http://localhost:5000/api/chat', {
        protocol: "mcp",
        version: "1.0",
        module: "chat",
        context_id: "user123",
        data: { user_message: currentQuestion }
      });
      
      
      const aiResponse = response.data.data.response;


      // const aiResponse = response.data.candidates[0].content.parts[0].text;
      setChatHistory((prev) => [...prev, { type: "answer", content: aiResponse }]);
    } catch (error) {
      console.log(error);
      setChatHistory((prev) => [...prev, { type: "answer", content: "Sorry - Something went wrong. Please try again!" }]);
    }
    setGeneratingAnswer(false);
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-r from-purple-400 to-indigo-600 flex flex-col items-center justify-center p-4">
      {/* Chat Container */}
      <div className="w-full max-w-3xl h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <header className="text-center p-4 border-b bg-indigo-500 rounded-t-2xl">
          <h1 className="text-2xl font-bold text-white">Chat AI</h1>
        </header>

        {/* Chat Messages */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 hide-scrollbar">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="bg-indigo-50 rounded-xl p-6 max-w-lg">
                <h2 className="text-xl font-bold text-indigo-600 mb-3">Welcome to Chat AI! 👋</h2>
                <p className="text-gray-600">Ask me anything! I can help with:</p>
                {/* <ul className="mt-2 text-gray-700 space-y-1">
                  <li>💡 General knowledge</li>
                  <li>🔧 Technical questions</li>
                  <li>📝 Writing assistance</li>
                  <li>🤔 Problem-solving</li>
                </ul> */}
                <p className="text-gray-500 mt-4 text-sm">Type your question below and press Enter!</p>
              </div>
            </div>
          ) : (
            chatHistory.map((chat, index) => (
              <div key={index} className={`flex ${chat.type === "question" ? "justify-end" : "justify-start"} mb-3`}>
                <div
                  className={`max-w-[75%] p-3 rounded-lg shadow ${
                    chat.type === "question" ? "bg-indigo-500 text-white rounded-br-none" : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <ReactMarkdown>{chat.content}</ReactMarkdown>
                </div>
              </div>
            ))
          )}

          {generatingAnswer && (
            <div className="text-left">
              <div className="inline-block bg-gray-100 p-3 rounded-lg animate-pulse">Thinking...</div>
            </div>
          )}
        </div>

        {/* Input Box */}
        <form onSubmit={generateAnswer} className="p-4 bg-gray-100 rounded-b-2xl">
          <div className="flex items-center space-x-2">
            <textarea
              className="bg-black flex-1 p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
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
            ></textarea>
            <button
              type="submit"
              className={`px-5 py-2 bg-indigo-500 text-grey-200 rounded-lg hover:bg-indigo-600 transition-colors ${
                generatingAnswer ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={generatingAnswer}
            >
              Send 
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
