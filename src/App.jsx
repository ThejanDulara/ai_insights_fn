// import Insight from "./components/insight";
// import Chatbot from "./components/chatbot";

// function App() {
//   return (
//     <div style={{ padding: 40 }}>
//       <h1>AI Insights & Chatbot</h1>
//       <Insight />
//       <Chatbot />
//     </div>
//   );
// }

// export default App;





import React from "react";
import Insight from "./components/insight";
import Chatbot from "./components/chatbot";
import Header from "./components/Header";
import Footer from "./components/Footer";
import "./App.css";


function App() {
  return (
    <div className="app-layout">
      <Header />

      <main className="main-content page-split">
        <div className="left-panel">
          <Chatbot />
        </div>
        <div className="right-panel">
          <Insight />
        </div>
      </main>

      <Footer />
    </div>
  );
}


export default App;

