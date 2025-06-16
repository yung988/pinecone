import React, { FormEvent, ChangeEvent, useState } from "react";
import Messages from "./Messages";
import { Message } from "ai/react";
import { AiOutlineSend, AiOutlineBot } from "react-icons/ai";

interface Chat {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleMessageSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  messages: Message[];
}

const Chat: React.FC<Chat> = ({
  input,
  handleInputChange,
  handleMessageSubmit,
  messages,
}) => {
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    setIsTyping(true);
    await handleMessageSubmit(e);
    setIsTyping(false);
  };

  const quickQuestions = [
    "Co je kvantové provázání?",
    "Vysvětli teorii relativity",
    "Jak fungují gravitační vlny?",
    "Co je temná hmota?",
    "Vysvětli Higgsův boson",
    "Jak funguje kvantová teleportace?"
  ];

  return (
    <div id="chat" className="flex flex-col h-full bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <AiOutlineBot className="text-xl text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Physics AI Advisor</h1>
            <p className="text-blue-200 text-sm">Pokročilý AI expert na fyziku a kvantové teorie</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <Messages messages={messages} />
      </div>

      {/* Quick Questions (only when no messages) */}
      {messages.length === 0 && (
        <div className="p-4 border-t border-gray-700">
          <p className="text-gray-400 text-sm mb-3">💡 Rychlé otázky:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  const fakeEvent = {
                    target: { value: question }
                  } as ChangeEvent<HTMLInputElement>;
                  handleInputChange(fakeEvent);
                }}
                className="text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 text-gray-300 text-sm transition-colors duration-200"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Zeptejte se na cokoliv o fyzice..."
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={input}
              onChange={handleInputChange}
              disabled={isTyping}
            />
            {input && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-xs text-gray-400">Enter ↵</span>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
          >
            {isTyping ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <AiOutlineSend className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">{isTyping ? 'Myslím...' : 'Odeslat'}</span>
          </button>
        </form>
        <div className="mt-2 text-xs text-gray-500 text-center">
          AI může dělat chyby. Ověřte si důležité informace.
        </div>
      </div>
    </div>
  );
};

export default Chat;
