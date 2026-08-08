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
  const [activePage, setActivePage] = useState<"dashboard" | "chat" | "reports" | "profile" | "settings">("dashboard");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ============================================
  // DASHBOARD + REPORTS STATE (lifted up here so
  // hooks are always called in the same order,
  // regardless of which tab is active)
  // ============================================
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsData, setReportsData] = useState<any[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(json => { setDashboardData(json); setDashboardLoading(false); })
      .catch(() => setDashboardLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/reports')
      .then(res => res.json())
      .then(json => { setReportsData(json); setReportsLoading(false); })
      .catch(() => setReportsLoading(false));
  }, []);

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
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4"
              >
                <div className="text-xs text-gray-400 uppercase tracking-wide">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
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
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
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
            <tr className="border-b border-white/10">
              {keys.map((key) => (
                <th key={key} className="text-left py-2 px-3 text-gray-400 font-medium uppercase text-xs">
                  {key.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                {keys.map((key) => {
                  const val = row[key];
                  if (typeof val === "number") {
                    const isCurrency = ["sales", "profit", "cost", "revenue", "margin"].some((k) =>
                      key.toLowerCase().includes(k)
                    );
                    const isPercent = key.toLowerCase().includes("margin") || key.includes("_pct");
                    return (
                      <td key={key} className="py-2 px-3 text-gray-200">
                        {isCurrency ? `$${val.toLocaleString()}` : isPercent ? `${val.toFixed(1)}%` : val.toLocaleString()}
                      </td>
                    );
                  }
                  return <td key={key} className="py-2 px-3 text-gray-200">{String(val)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ============================================
  // SIDEBAR NAVIGATION
  // ============================================

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "chat", label: "AI Chat", icon: "💬" },
    { id: "reports", label: "Reports", icon: "📄" },
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  // ============================================
  // DASHBOARD VIEW (DYNAMIC)
  // ============================================

  const renderDashboard = () => {
    if (dashboardLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
            </div>
            <p className="text-sm">Connecting to data engine...</p>
          </div>
        </div>
      );
    }

    if (!dashboardData) return <div className="text-red-400 p-4">Failed to load dashboard data.</div>;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">MetricMind Dashboard</h2>
          <p className="text-gray-400 text-sm">AI Powered Business Analytics</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Total Sales</div>
            <div className="text-2xl font-bold text-white">${dashboardData.kpis.total_sales.toLocaleString('en-US')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Total Profit</div>
            <div className="text-2xl font-bold text-white">${dashboardData.kpis.total_profit.toLocaleString('en-US')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Total Orders</div>
            <div className="text-2xl font-bold text-white">{dashboardData.kpis.total_orders.toLocaleString('en-US')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Profit Margin</div>
            <div className="text-2xl font-bold text-white">{dashboardData.kpis.avg_profit_margin}%</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Sales by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.sales_by_category}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", color: "#e2e8f0" }} />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Sales by Region</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.sales_by_region}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="region" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", color: "#e2e8f0" }} />
                  <Bar dataKey="sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Sales Trend (Monthly)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.sales_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", color: "#e2e8f0" }} />
                <Line type="monotone" dataKey="sales" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // CHAT VIEW (COMPLETE WITH INPUT)
  // ============================================

  const renderChat = () => {
    return (
      <div className="flex flex-col h-[calc(100vh-100px)]">
        {/* Message History - Scrollable area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] ${msg.role === "user" ? "order-2" : "order-1"}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "bg-white/10 backdrop-blur-sm border border-white/10 text-gray-100"
                    }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {msg.reasoning && msg.reasoning.length > 0 && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
                        🔍 Multi-Step Reasoning
                      </div>
                      {msg.reasoning.map((step: any) => (
                        <div key={step.step} className="flex gap-3 mb-2 last:mb-0">
                          <div className="w-6 h-6 bg-blue-600/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">
                            {step.step}
                          </div>
                          <div>
                            <div className="text-sm text-gray-200">{step.action}</div>
                            <div className="text-xs text-gray-400 italic">"{step.agent_thought}"</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.data && msg.data.length > 0 && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      {renderChart(msg.data, msg.visualization || "bar_chart")}
                      {renderDataTable(msg.data)}
                    </div>
                  )}

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
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
                            className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-1.5 rounded-full transition border border-white/10"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.transparency && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-400 hover:text-gray-300 font-medium">
                          🔎 Transparency — View API Call
                        </summary>
                        <pre className="mt-2 p-3 bg-black/30 rounded-lg overflow-x-auto text-gray-300 text-xs border border-white/10">
                          {JSON.stringify(msg.transparency, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* THE CHAT INPUT BOX AND SEND BUTTON */}
        <div className="mt-4 pt-4 border-t border-white/10 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder="Ask about your sales data..."
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 placeholder-gray-500 transition"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`px-6 py-3 rounded-xl font-medium transition ${isLoading || !input.trim()
              ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
              }`}
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    );
  };

  // ============================================
  // REPORTS VIEW (DYNAMIC)
  // ============================================

  const renderReports = () => {
    if (reportsLoading) return <div className="text-gray-400 p-6">Loading reports...</div>;

    return (
      <div className="flex flex-col w-full max-w-4xl text-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Analytics Reports</h2>
            <p className="text-gray-400 text-sm">Export and manage your analytics reports</p>
          </div>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
            + Generate New Report
          </button>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/10 border-b border-white/10">
              <tr><th className="p-4 text-sm font-medium text-gray-400">Report Name</th><th className="p-4 text-sm font-medium text-gray-400">Type</th><th className="p-4 text-sm font-medium text-gray-400">Date Generated</th><th className="p-4 text-sm font-medium text-gray-400">Status</th><th className="p-4 text-sm font-medium text-gray-400">Action</th></tr>
            </thead>
            <tbody>
              {reportsData.map((rep) => (
                <tr key={rep.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium">{rep.name}</td>
                  <td className="p-4 text-gray-400">{rep.type}</td>
                  <td className="p-4 text-gray-400">{rep.date}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full border ${rep.status === 'Ready' ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'}`}>
                      {rep.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {rep.action === 'Download' ? <button className="text-blue-400 hover:text-blue-300">Download</button> : <span className="text-gray-600">Pending</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ============================================
  // PROFILE VIEW
  // ============================================

  const renderProfile = () => (
    <div className="flex flex-col w-full max-w-4xl text-white">
      <h2 className="text-2xl font-bold mb-1">User Profile</h2>
      <p className="text-gray-400 text-sm mb-6">Manage your account settings and personal details.</p>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-6 pb-6 border-b border-white/10 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-3xl font-bold">
            A
          </div>
          <div>
            <button className="bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-lg text-sm transition-colors border border-white/10">
              Change Avatar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
            <input type="text" defaultValue="Ayush" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <input type="email" defaultValue="team@metricmind.app" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
            <input type="text" readOnly defaultValue="Admin / Developer" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-gray-400 outline-none cursor-not-allowed" />
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Update Profile
          </button>
          <button className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-lg font-medium transition-colors border border-white/10">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================
  // SETTINGS VIEW
  // ============================================

  const renderSettings = () => (
    <div className="flex flex-col w-full max-w-4xl text-white">
      <h2 className="text-2xl font-bold mb-1">Settings</h2>
      <p className="text-gray-400 text-sm mb-6">Configure your application preferences.</p>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-medium mb-4">Appearance</h3>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="font-medium">Dark Mode</p>
            <p className="text-sm text-gray-400">Enable dark theme across the dashboard</p>
          </div>
          <div className="w-12 h-6 bg-purple-600 rounded-full relative cursor-pointer">
            <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-medium mb-4">General</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Default Currency</label>
            <select className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-purple-500">
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>INR (₹)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Timezone</label>
            <select className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-purple-500">
              <option>UTC (Coordinated Universal Time)</option>
              <option>America/New_York</option>
              <option>Asia/Kolkata</option>
            </select>
          </div>
          <button className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================
  // MAIN RETURN
  // ============================================

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 text-neutral-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-white/5 backdrop-blur-md flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">🧠 MetricMind</h1>
          <p className="text-xs text-gray-400">AI Business Analytics</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${activePage === item.id
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-gray-500">MetricMind</p>
          <p className="text-xs text-gray-500">Version 1.0.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {activePage === "dashboard" && renderDashboard()}
        {activePage === "chat" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">AI Chat</h2>
              <span className="text-xs text-gray-400">Ask anything about your data</span>
            </div>
            {renderChat()}
          </div>
        )}
        {activePage === "reports" && renderReports()}
        {activePage === "profile" && renderProfile()}
        {activePage === "settings" && renderSettings()}
      </main>
    </div>
  );
}
