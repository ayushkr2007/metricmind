"use client";

import { useState, useRef, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Message = {
  role: "user" | "assistant";
  content: string;
  data?: any[];
  reasoning?: any[];
  visualization?: string;
  transparency?: any;
  suggestions?: string[];
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Hi! I'm **MetricMind**. Ask me anything about your sales data — revenue, profit, margins, or trends.\n\nTry: *\"Show me sales by category\"* or *\"What's our profit margin?\"*",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const downloadCSV = (data: any[]) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
    ];
    const csv = csvRows.join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'metricmind_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) {
        throw new Error("API request failed");
      }

      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.explanation || data.message || "Here's your analysis:",
        data: data.data,
        reasoning: data.reasoning_steps,
        visualization: data.visualization,
        transparency: data.transparency,
        suggestions: data.suggestions || ["Show me sales by category", "What's our profit margin?", "Show me sales trend over time"],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Sorry, I couldn't process your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const renderChart = (data: any[], vizType: string) => {
    if (!data || data.length === 0) return null;

    const keys = Object.keys(data[0]);
    const labelKey = keys.find((k) => typeof data[0][k] === "string") || keys[0];
    const valueKeys = keys.filter((k) => typeof data[0][k] === "number");

    const isSingleRow = data.length === 1;

    if (isSingleRow) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {Object.entries(data[0]).map(([key, val]) => {
            if (typeof val !== "number") return null;
            const isCurrency = ["sales", "profit", "cost", "revenue", "margin"].some((k) =>
              key.toLowerCase().includes(k)
            );
            const isPercent = key.toLowerCase().includes("margin") || key.includes("_pct");
            const displayVal = isCurrency
              ? `$${val.toLocaleString()}`
              : isPercent
                ? `${val.toFixed(1)}%`
                : val.toLocaleString();
            return (
              <div
                key={key}
                className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4"
              >
                <div className="text-xs text-neutral-400 uppercase tracking-wide">
                  {key.replace(/_/g, " ")}
                </div>
                <div className="text-xl font-bold text-white mt-1">{displayVal}</div>
              </div>
            );
          })}
        </div>
      );
    }

    const isLineChart = vizType === "line_chart";

    return (
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {isLineChart ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey={labelKey} stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                }}
              />
              <Legend />
              {valueKeys.map((key, idx) => {
                const colors = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444"];
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={2}
                    dot={{ fill: colors[idx % colors.length] }}
                  />
                );
              })}
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey={labelKey} stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                }}
              />
              <Legend />
              {valueKeys.map((key, idx) => {
                const colors = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444"];
                return (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={colors[idx % colors.length]}
                    radius={[4, 4, 0, 0]}
                  />
                );
              })}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  const renderDataTable = (data: any[]) => {
    if (!data || data.length === 0) return null;
    const keys = Object.keys(data[0]);

    return (
      <div className="mt-4 overflow-x-auto">
        <div className="flex justify-end mb-2">
          <button
            onClick={() => downloadCSV(data)}
            className="text-xs text-blue-400 hover:text-blue-300 transition"
          >
            📥 Download CSV
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700">
              {keys.map((key) => (
                <th key={key} className="text-left py-2 px-3 text-neutral-400 font-medium uppercase text-xs">
                  {key.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                {keys.map((key) => {
                  const val = row[key];
                  if (typeof val === "number") {
                    const isCurrency = ["sales", "profit", "cost", "revenue", "margin"].some((k) =>
                      key.toLowerCase().includes(k)
                    );
                    const isPercent = key.toLowerCase().includes("margin") || key.includes("_pct");
                    return (
                      <td key={key} className="py-2 px-3 text-neutral-200">
                        {isCurrency ? `$${val.toLocaleString()}` : isPercent ? `${val.toFixed(1)}%` : val.toLocaleString()}
                      </td>
                    );
                  }
                  return <td key={key} className="py-2 px-3 text-neutral-200">{String(val)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">🧠 MetricMind</h1>
          <p className="text-sm text-neutral-400">Agentic Semantic BI Engine</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-neutral-400">Agent Online</span>
        </div>
      </header>

      {/* Chat messages */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] ${msg.role === "user" ? "order-2" : "order-1"}`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 text-neutral-100"
                  }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Reasoning Steps */}
                {msg.reasoning && msg.reasoning.length > 0 && (
                  <div className="mt-3 border-t border-neutral-700 pt-3">
                    <div className="text-xs text-neutral-400 font-medium uppercase tracking-wide mb-2">
                      🔍 Multi-Step Reasoning
                    </div>
                    {msg.reasoning.map((step: any) => (
                      <div key={step.step} className="flex gap-3 mb-2 last:mb-0">
                        <div className="w-6 h-6 bg-blue-600/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">
                          {step.step}
                        </div>
                        <div>
                          <div className="text-sm text-neutral-200">{step.action}</div>
                          <div className="text-xs text-neutral-400 italic">"{step.agent_thought}"</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Data Display */}
                {msg.data && msg.data.length > 0 && (
                  <div className="mt-3 border-t border-neutral-700 pt-3">
                    {renderChart(msg.data, msg.visualization || "bar_chart")}
                    {renderDataTable(msg.data)}
                  </div>
                )}

                {/* Suggested follow-up questions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-700">
                    <div className="text-xs text-neutral-400 font-medium uppercase tracking-wide mb-2">
                      💡 Try Asking:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.suggestions.map((suggestion: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInput(suggestion);
                            setTimeout(() => handleSend(), 100);
                          }}
                          className="text-xs bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-full transition"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transparency Panel */}
                {msg.transparency && (
                  <div className="mt-3 pt-3 border-t border-neutral-700">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-neutral-400 hover:text-neutral-300 font-medium">
                        🔎 Transparency — View API Call
                      </summary>
                      <pre className="mt-2 p-3 bg-neutral-900 rounded-lg overflow-x-auto text-neutral-300 text-xs">
                        {JSON.stringify(msg.transparency, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Footer with name */}
      <div className="text-center text-xs text-neutral-500 py-2 border-t border-neutral-800">
        Built by Ayush Gautam &bull; Powered by Groq, Cube, Snowflake
      </div>

      {/* Input bar */}
      <footer className="border-t border-neutral-800 px-6 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your sales data..."
            className="flex-1 rounded-full bg-neutral-800 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600 text-white placeholder:text-neutral-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}