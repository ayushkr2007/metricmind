  // ============================================
  // CHAT VIEW (FIXED: Added Input Box)
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

        {/* THE FIXED INPUT AREA */}
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
            className={`px-6 py-3 rounded-xl font-medium transition ${
              isLoading || !input.trim()
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