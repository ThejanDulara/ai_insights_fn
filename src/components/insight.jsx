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

  if (loading) return <p style={styles.center}>Loading insights…</p>;
  if (error) return <p style={{ ...styles.center, color: "red" }}>{error}</p>;
  if (!data) return <p style={styles.center}>No insight data available</p>;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>AI Insights Summary</h1>

        <Section title="Insights" items={data.insights} color="#e3f2fd" />
        <Section title="Reasons" items={data.reasons} color="#f1f8e9" />
        <Section title="Risks" items={data.risks} color="#fff3e0" />
        <Section title="Recommendations" items={data.recommendations} color="#ede7f6" />
      </div>
    </div>
  );
}

/* ------------------ PARSER (UNCHANGED) ------------------ */

function parseToObject(input) {
  if (!input) return null;

  let value = input;

  if (typeof value === "string") {
    value = value.replace(/```json|```/g, "").trim();
  }

  try {
    for (let i = 0; i < 3; i++) {
      if (typeof value === "string") {
        const cleanInput = value.replace(/\u00a0/g, " ");
        value = JSON.parse(cleanInput);
      } else {
        break;
      }
    }
  } catch (e) {
    throw new Error("Could not parse AI data. Ensure it is valid JSON.");
  }

  return {
    insights: Array.isArray(value.insights) ? value.insights : [],
    reasons: Array.isArray(value.reasons) ? value.reasons : [],
    risks: Array.isArray(value.risks) ? value.risks : [],
    recommendations: Array.isArray(value.recommendations) ? value.recommendations : [],
  };
}

/* ------------------ SECTION COMPONENT ------------------ */

function Section({ title, items, color }) {
  if (!items || items.length === 0) return null;

  return (
    <div style={{ ...styles.section, backgroundColor: color }}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <ul style={styles.list}>
        {items.map((text, idx) => (
          <li key={idx} style={styles.listItem}>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------ STYLES ------------------ */

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f7fb",
    padding: "40px 16px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: "14px",
    padding: "32px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  pageTitle: {
    marginBottom: "32px",
    fontSize: "28px",
    fontWeight: "600",
    color: "#1f2937",
  },
  section: {
    borderRadius: "12px",
    padding: "20px 24px",
    marginBottom: "24px",
  },
  sectionTitle: {
    marginBottom: "12px",
    fontSize: "20px",
    fontWeight: "600",
    color: "#111827",
  },
  list: {
    paddingLeft: "18px",
  },
  listItem: {
    marginBottom: "10px",
    lineHeight: "1.7",
    color: "#374151",
  },
  center: {
    textAlign: "center",
    marginTop: "60px",
    fontSize: "16px",
  },
};
