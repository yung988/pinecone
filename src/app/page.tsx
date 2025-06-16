"use client";

import React, { useEffect, useRef, useState, FormEvent } from "react";
import { Context } from "@/components/Context";
import Header from "@/components/Header";
import Chat from "@/components/Chat";
import ChatHistory from "@/components/ChatHistory";
import { useChat } from "ai/react";
import InstructionModal from "./components/InstructionModal";
import { AiFillGithub, AiOutlineInfoCircle, AiOutlineHistory } from "react-icons/ai";
import { ChatSession, saveChatSession, generateChatTitle, generateSessionId } from "@/utils/chatStorage";
import { Message } from "ai";

const Page: React.FC = () => {
  const [gotMessages, setGotMessages] = useState(false);
  const [context, setContext] = useState<string[] | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [showChatHistory, setShowChatHistory] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    onFinish: async () => {
      setGotMessages(true);
    },
  });

  const prevMessagesLengthRef = useRef(messages.length);

  const handleMessageSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
    setContext(null);
    setGotMessages(false);
  };

  useEffect(() => {
    const getContext = async () => {
      const response = await fetch("/api/context", {
        method: "POST",
        body: JSON.stringify({
          messages,
        }),
      });
      const { context } = await response.json();
      setContext(context.map((c: any) => c.id));
    };
    if (gotMessages && messages.length >= prevMessagesLengthRef.current) {
      getContext();
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, gotMessages]);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 p-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🧬</div>
            <div>
              <h1 className="text-white font-bold text-lg">Physics AI Advisor</h1>
              <p className="text-blue-200 text-xs">Powered by World Research Data</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setModalOpen(true)}
              className="p-2 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition-colors"
              title="Informace o projektu"
            >
              <AiOutlineInfoCircle className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => {
                window.open(
                  "https://github.com/pinecone-io/pinecone-vercel-starter",
                  "_blank"
                );
              }}
              className="p-2 rounded-lg bg-gray-600/20 text-gray-300 hover:bg-gray-600/30 transition-colors"
              title="GitHub Repository"
            >
              <AiFillGithub className="w-5 h-5" />
            </button>

            <a
              href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpinecone-io%2Fpinecone-vercel-starter&env=OPENAI_API_KEY,PINECONE_API_KEY,PINECONE_CLOUD,PINECONE_REGION,PINECONE_INDEX&envDescription=API%20Keys%20needed%20to%20run%20the%20application&envLink=https%3A%2F%2Fdocs.pinecone.io%2Fdocs%2Fprojects%23api-keys&project-name=my-awesome-pinecone-vercel-project&repository-name=my-awesome-pinecone-vercel-project&demo-title=Pinecone%20%2B%20Vercel%20AI%20SDK%20Starter&demo-description=A%20Next.js%20starter%20chatbot%20using%20Vercel's%20AI%20SDK%20and%20implements%20the%20Retrieval-Augmented%20Generation%20(RAG)%20pattern%20with%20Pinecone&demo-url=https%3A%2F%2Fpinecone-vercel-example.vercel.app%2F&demo-image=https%3A%2F%2Fvercel.com%2F_next%2Fimage%3Furl%3Dhttps%253A%252F%252Fimages.ctfassets.net%252Fe5382hct74si%252F1G4xSqx0bCgVVv3aY3rrX4%252Ffa27791c39ddf058995561d794a68710%252FCleanShot_2023-07-21_at_11.55.49.png%26w%3D3840%26q%3D75%26dpl%3Ddpl_5bh93Tz7wfj1PdxgzMGwNCc1nAxA"
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
              title="Deploy na Vercel"
            >
              Deploy
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 min-w-0">
          <Chat
            input={input}
            handleInputChange={handleInputChange}
            handleMessageSubmit={handleMessageSubmit}
            messages={messages}
          />
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-80 border-l border-white/10 bg-black/20 backdrop-blur-lg">
          <Context className="h-full" selected={context} />
        </div>
      </div>

      {/* Modals */}
      <InstructionModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default Page;
