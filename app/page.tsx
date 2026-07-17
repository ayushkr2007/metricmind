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

// Dashboard data
const DASHBOARD_DATA = {
  kpis: {
    total_sales: 750000,
    total_profit: 145000,
    total_orders: 2700,
    avg_profit_margin: 19.3,
    unique_customers: 850,
  },
  sales_by_category: [
    { category: "Furniture", sales: 250000, profit: 35000 },
    { category: "Office Supplies", sales: 180000, profit: 42000 },
    { category: "Technology", sales: 320000, profit: 68000 },
  ],
  sales_by_region: [
    { region: "West", sales: 280000, profit: 52000 },
    { region: "East", sales: 240000, profit: 41000 },
    { region: "South", sales: 130000, profit: 22000 },
    { region: "Central", sales: 100000, profit: 30000 },
  ],
  sales_trend: [
    { month: "Jan", sales: 45000 },
    { month: "Feb", sales: 52000 },
    { month: "Mar", sales: 48000 },
    { month: "Apr", sales: 61000 },
    { month: "May", sales: 58000 },
    { month: "Jun", sales: 67000 },
    { month: "Jul", sales: 72000 },
    { month: "Aug", sales: 69000 },
    { month: "Sep", sales: 81000 },
    { month: "Oct", sales: 78000 },
    { month: "Nov", sales: 85000 },
    { month: "Dec", sales: 94000 },
  ],
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
  // DASHBOARD VIEW
  // ============================================

  const renderDashboard = () => {
    const kpis = DASHBOARD_DATA.kpis;

    return (
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-bold text-white">MetricMind Dashboard</h2>
          <p className="text-gray-400 text-sm">AI Powered Business Analytics</p>
        </div>

        {/* Analytics Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">📈 Analytics</h3>
          <p className="text-xs text-gray-400">Analyze your uploaded dataset and discover valuable insights.</p>
          <div className="mt-4 p-4 bg-white/5 rounded-lg text-center text-gray-400 text-sm">
            Loading analytics...
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Total Sales</div>
            <div className="text-2xl font-bold text-white">${kpis.total_sales.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Total Profit</div>
            <div className="text-2xl font-bold text-white">${kpis.total_profit.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Total Orders</div>
            <div className="text-2xl font-bold text-white">{kpis.total_orders.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Profit Margin</div>
            <div className="text-2xl font-bold text-white">{kpis.avg_profit_margin}%</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Sales by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DASHBOARD_DATA.sales_by_category}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Sales by Region</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DASHBOARD_DATA.sales_by_region}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="region" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Bar dataKey="sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sales Trend */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Sales Trend (Monthly)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DASHBOARD_DATA.sales_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                  }}
                />
                <Line type="monotone" dataKey="sales" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 py-2 border-t border-white/10">
          MetricMind • Version 1.0.0
        </div>
      </div>
    );
  };

  // ============================================
  // CHAT VIEW
  // ============================================

  const renderChat = () => {
    return (
      <div className="space-y-4">
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
    );
  };

  // ============================================
  // PLACEHOLDER VIEWS
  // ============================================

  const renderReports = () => (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="text-center">
        <div className="text-4xl mb-2">📄</div>
        <p>Reports coming soon</p>
        <p className="text-xs text-gray-500">Export and manage your analytics reports</p>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="text-center">
        <div className="text-4xl mb-2">👤</div>
        <p>User Profile</p>
        <p className="text-xs text-gray-500">Manage your account settings</p>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="text-center">
        <div className="text-4xl mb-2">⚙️</div>
        <p>Settings</p>
        <p className="text-xs text-gray-500">Configure your application preferences</p>
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
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">🧠 MetricMind</h1>
          <p className="text-xs text-gray-400">AI Business Analytics</p>
        </div>

        {/* Navigation */}
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

        {/* Footer */}
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