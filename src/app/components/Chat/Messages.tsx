import { Message } from "ai";
import { useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';

export default function Messages({ messages }: { messages: Message[] }) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-grow overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-gray-400 mt-8">
          <div className="text-6xl mb-4">🧬</div>
          <h2 className="text-2xl font-bold mb-2">Super Physics AI Advisor</h2>
          <p className="text-lg mb-4">Váš expert na kvantovou fyziku a pokročilé teorie</p>
          <div className="text-sm space-y-2">
            <p>💫 Ptejte se na kvantovou mechaniku, teorii pole, či částicovou fyziku</p>
            <p>🌌 Prozkoumejte kosmologii, temnou hmotu a gravitační vlny</p>
            <p>⚛️ Diskutujte QCT teorii a nejnovější výzkum</p>
          </div>
        </div>
      ) : (
        messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "assistant" ? "justify-start" : "justify-end"
            } animate-fadeIn`}
          >
            <div
              className={`max-w-4xl rounded-2xl p-4 shadow-lg ${
                msg.role === "assistant"
                  ? "bg-gradient-to-br from-blue-900 to-blue-800 text-blue-50 border border-blue-700"
                  : "bg-gradient-to-br from-green-800 to-green-700 text-green-50 border border-green-600"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                  msg.role === "assistant" 
                    ? "bg-blue-600" 
                    : "bg-green-600"
                }`}>
                  {msg.role === "assistant" ? "🧬" : "👤"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium mb-2 opacity-75">
                    {msg.role === "assistant" ? "Physics AI Advisor" : "Vy"}
                  </div>
                  <div className="prose prose-invert max-w-none">
                    {msg.role === "assistant" ? (
                      <ReactMarkdown
                        components={{
                          h1: ({children}) => <h1 className="text-2xl font-bold mb-4 text-blue-200">{children}</h1>,
                          h2: ({children}) => <h2 className="text-xl font-bold mb-3 text-blue-300">{children}</h2>,
                          h3: ({children}) => <h3 className="text-lg font-semibold mb-2 text-blue-400">{children}</h3>,
                          p: ({children}) => <p className="mb-3 leading-relaxed">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="text-blue-100">{children}</li>,
                          strong: ({children}) => <strong className="font-bold text-yellow-300">{children}</strong>,
                          em: ({children}) => <em className="italic text-blue-200">{children}</em>,
                          code: ({children}) => <code className="bg-gray-800 px-2 py-1 rounded text-green-300 font-mono text-sm">{children}</code>,
                          pre: ({children}) => <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-3 border border-gray-700">{children}</pre>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-blue-400 pl-4 italic text-blue-200 mb-3">{children}</blockquote>
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <div className="text-green-100">{msg.content}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
