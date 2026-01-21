import React, { useEffect, useState } from "react";

const API_URL = "https://ashengui-production.up.railway.app/api/ai-insights/latest";

export default function Insight() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) {
          throw new Error(json.error || "Failed to load data");
        }
        const normalized = parseToObject(json.data);
        setData(normalized);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Parsing Error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading insights…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!data) return <p>No insight data available</p>;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px", fontFamily: "sans-serif" }}>
      <Section title="Insights" items={data.insights} />
      <Section title="Reasons" items={data.reasons} />
      <Section title="Risks" items={data.risks} />
      <Section title="Recommendations" items={data.recommendations} />
    </div>
  );
}

/**
 * CLEANER & PARSER
 * Strips Markdown code blocks (```json ... ```) and parses the result.
 */
function parseToObject(input) {
  if (!input) return null;

  let value = input;

  // 1. Remove Markdown code block wrappers if they exist
  // This regex finds ```json or ``` at the start/end and removes them
  if (typeof value === "string") {
    value = value.replace(/```json|```/g, "").trim();
  }

  try {
    // 2. Multi-pass parse (handles double-encoded strings)
    for (let i = 0; i < 3; i++) {
      if (typeof value === "string") {
        // Clean non-breaking spaces
        const cleanInput = value.replace(/\u00a0/g, " ");
        value = JSON.parse(cleanInput);
      } else {
        break;
      }
    }
  } catch (e) {
    console.error("JSON Parse Error:", e);
    throw new Error("Could not parse AI data. Ensure it is valid JSON.");
  }

  return {
    insights: Array.isArray(value.insights) ? value.insights : [],
    reasons: Array.isArray(value.reasons) ? value.reasons : [],
    risks: Array.isArray(value.risks) ? value.risks : [],
    recommendations: Array.isArray(value.recommendations) ? value.recommendations : [],
  };
}

function Section({ title, items }) {
  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginBottom: "32px" }}>
      <h2 style={{ borderBottom: "2px solid #f0f0f0", paddingBottom: "8px" }}>{title}</h2>
      <ul style={{ paddingLeft: "20px" }}>
        {items.map((text, idx) => (
          <li key={idx} style={{ marginBottom: "12px", lineHeight: "1.6" }}>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}