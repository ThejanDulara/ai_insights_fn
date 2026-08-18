import React, { useEffect, useState } from "react";
import "./insight.css";

const API_URL = "http://127.0.0.1:5000/api/ai-insights/latest";

export default function Insight() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Voice
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(1);
  const [speaking, setSpeaking] = useState(false);

  // Fullscreen
  const [fullscreen, setFullscreen] = useState(false);

  /* ---------------- DATA LOAD ---------------- */
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(json => {
        if (!json.ok) throw new Error(json.error || "Failed to load data");
        setData(parseToObject(json.data));
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  /* ---------------- VOICE LOAD ---------------- */
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      if (!selectedVoice && v.length > 0) {
        setSelectedVoice(v.find(x => x.lang.startsWith("en")) || v[0]);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [selectedVoice]);

  /* ---------------- SPEAK ---------------- */

  const speakText = (text) => {
    if (!window.speechSynthesis) return alert("Voice not supported");

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = selectedVoice;
    utter.rate = rate;

    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);

    window.speechSynthesis.speak(utter);
  };

  const stopVoice = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const speakSection = (title, items) => {
    if (!items || items.length === 0) return;

    const text = `${title}. ${items
      .map((t, i) => `Point ${i + 1}. ${t}`)
      .join(". ")}`;

    speakText(text);
  };

  const speakAll = (data) => {
    let text = "";

    const ordered = getOrderedSections(data);

    ordered.forEach(([key, items]) => {
      if (!items || items.length === 0) return;
      text += `${formatTitle(key)}. ${items.join(". ")}. `;
    });

    speakText(text);
  };

  /* ---------------- RENDER ---------------- */

  if (loading) return <div className="insight-center">Loading insights…</div>;
  if (error) return <div className="insight-center insight-error">{error}</div>;
  if (!data) return <div className="insight-center">No data</div>;

  const orderedSections = getOrderedSections(data);

  return (
    <div className={`insight-page ${fullscreen ? "fullscreen" : ""}`}>
      <div className="insight-container">

        {/* HEADER */}
        <div className="insight-header">
          <h1 className="insight-page-title">
            AI Strategy Insights
          </h1>

          <button
            className="fullscreen-btn"
            onClick={() => setFullscreen(!fullscreen)}
          >
            {fullscreen ? "🗗 Exit Fullscreen" : "⛶ Fullscreen"}
          </button>
        </div>

        {/* VOICE */}
        <div className="voice-controls">

          <select
            value={selectedVoice?.name || ""}
            onChange={(e) =>
              setSelectedVoice(
                voices.find((v) => v.name === e.target.value)
              )
            }
          >
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>

          <label>
            Speed
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </label>

          {!speaking ? (
            <button onClick={() => speakAll(data)}>🔊 Read All</button>
          ) : (
            <button onClick={stopVoice}>🔇 Stop</button>
          )}
        </div>

        {/* SECTIONS */}
        {orderedSections.map(([key, items]) => (
          <Section
            key={key}
            title={formatTitle(key)}
            type={key}
            items={items}
            onSpeak={() =>
              speakSection(formatTitle(key), items)
            }
          />
        ))}

      </div>
    </div>
  );
}

/* ---------------- PARSER ---------------- */

function parseToObject(input) {
  let v = input;

  if (typeof v === "string")
    v = v.replace(/```json|```/g, "").trim();

  for (let i = 0; i < 3; i++) {
    if (typeof v === "string")
      v = JSON.parse(v.replace(/\u00a0/g, " "));
  }

  return v;
}

/* ---------------- ORDER LOGIC ---------------- */

function getOrderedSections(data) {
  const entries = Object.entries(data);

  // Move executive_summary to top
  const executive = entries.find(([k]) => k === "executive_summary");
  const rest = entries.filter(([k]) => k !== "executive_summary");

  return executive ? [executive, ...rest] : rest;
}

/* ---------------- FORMAT TITLE ---------------- */

function formatTitle(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ---------------- SECTION ---------------- */

function Section({ title, items, type, onSpeak }) {

  if (!items || items.length === 0) return null;

  return (
    <div className={`insight-section section-${type}`}>

      <div className="section-header">

        <h2 className="insight-section-title">

          {type.includes("executive") && "🧠"}
          {type.includes("performance") && "📊"}
          {type.includes("trend") && "📉"}
          {type.includes("root") && "🔍"}
          {type.includes("action") && "🚀"}

          {title}

        </h2>

        <button
          className="section-speak"
          onClick={onSpeak}
        >
          ▶ Read
        </button>

      </div>

      <ul className="insight-list">
        {items.map((t, i) => (
          <li key={i} className="insight-list-item">
            {t}
          </li>
        ))}
      </ul>

    </div>
  );
}
// import React, { useEffect, useState } from "react";
// import "./insight.css";

// const API_URL = "http://127.0.0.1:5000/api/ai-insights/latest";

// export default function Insight() {

//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [voices, setVoices] = useState([]);
//   const [selectedVoice, setSelectedVoice] = useState(null);
//   const [rate, setRate] = useState(1);
//   const [speaking, setSpeaking] = useState(false);

//   const [fullscreen, setFullscreen] = useState(false);

//   const [avatarMode, setAvatarMode] = useState(false);

//   /* ---------------- DATA LOAD ---------------- */

//   useEffect(() => {
//     fetch(API_URL)
//       .then(res => res.json())
//       .then(json => {
//         if (!json.ok) throw new Error(json.error || "Failed to load data");
//         setData(parseToObject(json.data));
//         setLoading(false);
//       })
//       .catch(err => {
//         setError(err.message);
//         setLoading(false);
//       });
//   }, []);

//   /* ---------------- VOICE LOAD ---------------- */

//   useEffect(() => {
//     const loadVoices = () => {
//       const v = window.speechSynthesis.getVoices();
//       setVoices(v);

//       if (!selectedVoice && v.length > 0) {
//         setSelectedVoice(v.find(x => x.lang.startsWith("en")) || v[0]);
//       }
//     };

//     loadVoices();
//     window.speechSynthesis.onvoiceschanged = loadVoices;

//   }, [selectedVoice]);

//   /* ---------------- SPEAK HELPERS ---------------- */

//   const speakText = (text) => {

//     if (!window.speechSynthesis) return alert("Voice not supported");

//     window.speechSynthesis.cancel();

//     const utter = new SpeechSynthesisUtterance(text);

//     utter.voice = selectedVoice;
//     utter.rate = rate;
//     utter.pitch = 1;

//     utter.onstart = () => setSpeaking(true);
//     utter.onend = () => setSpeaking(false);

//     window.speechSynthesis.speak(utter);
//   };

//   const stopVoice = () => {
//     window.speechSynthesis.cancel();
//     setSpeaking(false);
//   };

//   const speakSection = (title, items) => {

//     if (!items || items.length === 0) return;

//     const text =
//       `${title}. ${items.map((t, i) => `Point ${i + 1}. ${t}`).join(". ")}`;

//     speakText(text);
//   };

//   const speakAll = (data) => {

//     const text = `
//       Key Insights. ${data.insights.join(". ")}.
//       Root Causes. ${data.reasons.join(". ")}.
//       Potential Risks. ${data.risks.join(". ")}.
//       Strategic Recommendations. ${data.recommendations.join(". ")}.
//     `;

//     const utter = new SpeechSynthesisUtterance(text);

//     utter.voice = selectedVoice;
//     utter.rate = rate;

//     utter.onstart = () => setSpeaking(true);
//     utter.onend = () => setSpeaking(false);

//     window.speechSynthesis.cancel();
//     window.speechSynthesis.speak(utter);
//   };

//   /* ---------------- RENDER ---------------- */

//   if (loading) return <div className="insight-center">Loading insights…</div>;
//   if (error) return <div className="insight-center insight-error">{error}</div>;
//   if (!data) return <div className="insight-center">No data</div>;

//   return (
//     <div className={`insight-page ${fullscreen ? "fullscreen" : ""} ${avatarMode ? "hidden-panel" : ""}`}>

//       {/* FLOAT BUTTON TO RETURN */}

//       {avatarMode && (
//         <button
//           className="return-btn"
//           onClick={() => setAvatarMode(false)}
//         >
//           Show Insights
//         </button>
//       )}

//       {!avatarMode && (

//       <div className="insight-container">

//         <div className="insight-header">

//           <h1 className="insight-page-title">
//             AI Strategy Insights
//           </h1>

//           <div className="header-buttons">

//             <button
//               className="avatar-btn"
//               onClick={() => setAvatarMode(true)}
//             >
//               Avatar Mode
//             </button>

//             <button
//               className="fullscreen-btn"
//               onClick={() => setFullscreen(!fullscreen)}
//             >
//               {fullscreen ? "Exit Fullscreen" : "Fullscreen"}
//             </button>

//           </div>

//         </div>

//         <div className="voice-controls">

//           <select
//             value={selectedVoice?.name || ""}
//             onChange={(e) =>
//               setSelectedVoice(voices.find(v => v.name === e.target.value))
//             }
//           >

//             {voices.map(v => (
//               <option key={v.name} value={v.name}>
//                 {v.name} ({v.lang})
//               </option>
//             ))}

//           </select>

//           <label>
//             Speed
//             <input
//               type="range"
//               min="0.7"
//               max="1.3"
//               step="0.1"
//               value={rate}
//               onChange={e => setRate(Number(e.target.value))}
//             />
//           </label>

//           {!speaking
//             ? <button onClick={() => speakAll(data)}>Read All</button>
//             : <button onClick={stopVoice}>Stop</button>
//           }

//         </div>

//         <Section
//           title="Key Insights"
//           items={data.insights}
//           type="insights"
//           onSpeak={() => speakSection("Key Insights", data.insights)}
//         />

//         <Section
//           title="Root Causes"
//           items={data.reasons}
//           type="reasons"
//           onSpeak={() => speakSection("Root Causes", data.reasons)}
//         />

//         <Section
//           title="Potential Risks"
//           items={data.risks}
//           type="risks"
//           onSpeak={() => speakSection("Potential Risks", data.risks)}
//         />

//         <Section
//           title="Strategic Recommendations"
//           items={data.recommendations}
//           type="recommendations"
//           onSpeak={() => speakSection("Strategic Recommendations", data.recommendations)}
//         />

//       </div>

//       )}

//     </div>
//   );
// }

// /* ---------------- PARSER ---------------- */

// function parseToObject(input) {

//   let v = input;

//   if (typeof v === "string")
//     v = v.replace(/```json|```/g, "").trim();

//   for (let i = 0; i < 3; i++) {
//     if (typeof v === "string")
//       v = JSON.parse(v.replace(/\u00a0/g, " "));
//   }

//   return {
//     insights: v.insights || [],
//     reasons: v.reasons || [],
//     risks: v.risks || [],
//     recommendations: v.recommendations || []
//   };
// }

// /* ---------------- SECTION ---------------- */

// function Section({ title, items, type, onSpeak }) {

//   if (!items || items.length === 0) return null;

//   return (
//     <div className={`insight-section section-${type}`}>

//       <div className="section-header">

//         <h2 className="insight-section-title">

//           {type === "insights" && "💡"}
//           {type === "reasons" && "🔍"}
//           {type === "risks" && "⚠️"}
//           {type === "recommendations" && "🚀"}

//           {title}

//         </h2>

//         <button className="section-speak" onClick={onSpeak}>
//           Read
//         </button>

//       </div>

//       <ul className="insight-list">

//         {items.map((t, i) => (
//           <li key={i} className="insight-list-item">{t}</li>
//         ))}

//       </ul>

//     </div>
//   );
// }