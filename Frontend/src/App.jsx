import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChatBot from "./pages/ChatBot";
import LandingPage from "./pages/LandingPage";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* <Route path="/signin" element={<SignIn />} /> */}
        <Route path="/chat" element={<ChatBot />} />
      </Routes>
    </Router>
  );
};

export default App;
