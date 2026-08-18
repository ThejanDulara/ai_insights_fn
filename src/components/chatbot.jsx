// import { useState } from "react";

// export default function Chatbot() {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);

//   const sendMessage = async () => {
//     if (!input.trim()) return;

//     const userMessage = { role: "user", text: input };
//     setMessages([...messages, userMessage]);
//     setInput("");
//     setLoading(true);

//     const res = await fetch("/api/chat", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question: input })
//     });

//     const data = await res.json();

//     const botMessage = {
//       role: "assistant",
//       text: data.answer || "Error getting response"
//     };

//     setMessages(prev => [...prev, botMessage]);
//     setLoading(false);
//   };

//   return (
//     <div style={{ maxWidth: 600, margin: "auto" }}>
//       <h2>📊 Business Insights Chat</h2>

//       <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 300 }}>
//         {messages.map((m, i) => (
//           <div key={i} style={{ marginBottom: 8 }}>
//             <strong>{m.role === "user" ? "You" : "AI"}:</strong> {m.text}
//           </div>
//         ))}
//         {loading && <div>AI is thinking…</div>}
//       </div>

//       <div style={{ display: "flex", marginTop: 10 }}>
//         <input
//           value={input}
//           onChange={e => setInput(e.target.value)}
//           style={{ flex: 1, padding: 8 }}
//           placeholder="Ask about sales, media, trends…"
//         />
//         <button onClick={sendMessage} style={{ marginLeft: 5 }}>
//           Send
//         </button>
//       </div>
//     </div>
//   );
// }





import { useState, useRef } from "react";
import "./chatbot.css";
import HeyGenAvatar from "./HeyGenAvatar";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [isTalking, setIsTalking] = useState(false);

  const recognitionRef = useRef(null);
  const lastAIRef = useRef("");
  const heygenAvatarRef = useRef(null); // holds the HeyGen avatar SDK instance

  /* ---------------- FORMAT AI ---------------- */
  const formatAI = (text) => {
    let html = text;
    html = html.replace(/\*\*(.*?)\*\*/g, "<h3>$1</h3>");
    html = html.replace(/\d+\.\s/g, "<li>");
    html = html.replace(/(<li>.*?)(?=<li>|$)/gs, "<ul>$1</ul>");
    html = html.replace(/\n/g, "<br />");
    return html;
  };

  /* ---------------- SPEAK (HeyGen + browser fallback) ---------------- */
  const speakAI = (text) => {
    const cleanText = text.replace(/[*_#>`]/g, '');

    // ── HeyGen avatar speaks ─────────────────────
    if (heygenAvatarRef.current) {
      heygenAvatarRef.current.speak({
        text: cleanText
      });
      setIsTalking(true);
      return;
    }

    // ── Browser fallback TTS ─────────────────────
    if (!voiceOn || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = "en-US";
    utter.rate = 0.95;
    utter.pitch = 1;

    utter.onstart = () => setIsTalking(true);
    utter.onend = () => setIsTalking(false);
    utter.onerror = () => setIsTalking(false);

    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    if (heygenAvatarRef.current) {
      heygenAvatarRef.current.interrupt?.();
    } else {
      window.speechSynthesis.cancel();
    }
    setIsTalking(false);
  };

  const replayLast = () => {
    if (lastAIRef.current) {
      speakAI(lastAIRef.current);
    }
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = async (textOverride) => {
    const messageText = textOverride ?? input;
    if (!messageText.trim()) return;

    setMessages(prev => [...prev, { role: "user", text: messageText }]);
    setInput("");
    setLoading(true);

    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: messageText })
      });

      const data = await res.json();
      const answer = data.answer || "Error";

      lastAIRef.current = answer;

      setMessages(prev => [...prev, { role: "assistant", text: answer }]);

      speakAI(answer);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- VOICE INPUT ---------------- */
  const toggleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input not supported in this browser");
      return;
    }

    if (listening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true; // live typing
    recognition.continuous = false; // ends automatically

    const startingInput = input; // remember what was already typed

    recognition.onstart = () => {
      setListening(true);
      // Tell HeyGen avatar to start listening
      if (heygenAvatarRef.current?.startListening) {
        heygenAvatarRef.current.startListening();
      }
    };

    recognition.onresult = (event) => {
      // Map over all results (both interim and final) for the current session
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");

      const combined = startingInput ? startingInput + " " + transcript : transcript;
      setInput(combined);
      
      // Store on the recognition instance so onend can read it asynchronously
      recognition.latestResult = combined;
    };

    recognition.onerror = (e) => {
      console.error("Speech Recognition Error:", e);
      setListening(false);
      if (heygenAvatarRef.current?.stopListening) {
        heygenAvatarRef.current.stopListening();
      }
    };

    recognition.onend = () => {
      setListening(false);
      if (heygenAvatarRef.current?.stopListening) {
        heygenAvatarRef.current.stopListening();
      }
      
      // Auto-send the final captured transcript
      const finalToSend = recognition.latestResult;
      if (finalToSend && finalToSend.trim() && finalToSend !== startingInput) {
        sendMessage(finalToSend);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  /* ---------------- RENDER ---------------- */
  return (
    <>
      <div className="avatar-wrapper">
        <div
          className={`ai-avatar-container ${loading ? 'thinking' : isTalking ? 'talking' : 'listening'}`}
        >
          <HeyGenAvatar
            avatarState={loading ? 'thinking' : isTalking ? 'talking' : 'listening'}
            avatarRef={heygenAvatarRef}
            onAvatarReady={() => console.log('HeyGen avatar ready!')}
          />
        </div>
        <div className="avatar-status-badge">
          {loading ? "Thinking..." : isTalking ? "Speaking..." : listening ? "Listening..." : "Online"}
        </div>
      </div>

      <div className="chatbot-wrapper">
        {!open && (
          <button className="chatbot-fab" onClick={() => setOpen(true)}>💬</button>
        )}

        {open && (
          <div
            className="chatbot-box"
            style={{
              width: expanded ? 460 : 340,
              height: expanded ? 620 : 440
            }}
          >
            <div className="chatbot-header">
              <span>📊Chatbot</span>
              <div>
                <button onClick={() => setVoiceOn(!voiceOn)}>
                  {voiceOn ? "🔊" : "🔇"}
                </button>
                <button onClick={stopSpeaking}>⏹</button>
                <button onClick={replayLast}>🔁</button>
                <button onClick={() => setExpanded(!expanded)}>
                  {expanded ? "🗗" : "🗖"}
                </button>
                <button onClick={() => setOpen(false)}>✖</button>
              </div>
            </div>

            <div className="chatbot-body">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`chatbot-message ${m.role}`}
                  onClick={() => m.role === "assistant" && speakAI(m.text)}
                  style={{ cursor: m.role === "assistant" ? "pointer" : "default" }}
                >
                  <div
                    className="chatbot-bubble"
                    dangerouslySetInnerHTML={
                      m.role === "assistant"
                        ? { __html: formatAI(m.text) }
                        : undefined
                    }
                  >
                    {m.role === "user" ? m.text : null}
                  </div>
                </div>
              ))}

              {loading && <div className="chatbot-loading">AI is thinking…</div>}
            </div>

            <div className="chatbot-footer">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={listening ? "Listening…" : "Ask about sales, media, trends…"}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
              />

              <button onClick={toggleVoiceInput}>
                {listening ? "🎙️" : "🎤"}
              </button>

              <button onClick={() => sendMessage()}>Send</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

