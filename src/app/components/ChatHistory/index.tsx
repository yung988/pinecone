import React, { useState, useEffect } from 'react';
import { ChatSession, getChatSessions, deleteChatSession, exportChats, importChats } from '@/utils/chatStorage';
import { AiOutlineDelete, AiOutlineDownload, AiOutlineUpload, AiOutlinePlus } from 'react-icons/ai';

interface ChatHistoryProps {
  currentSessionId?: string;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  className?: string;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  currentSessionId,
  onSelectSession,
  onNewChat,
  className = ''
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingImporting, setIsExportingImporting] = useState(false);

  const refreshSessions = async () => {
    setIsLoading(true);
    try {
      const fetchedSessions = await getChatSessions();
      setSessions(fetchedSessions);
    } catch (error) {
      console.error('Error refreshing sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSessions();
  }, []);

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Opravdu chcete smazat tuto konverzaci?')) {
      const success = await deleteChatSession(sessionId);
      if (success) {
        refreshSessions();
      } else {
        alert('Chyba při mazání konverzace.');
      }
    }
  };

  const handleExport = async () => {
    setIsExportingImporting(true);
    try {
      const data = await exportChats();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Chyba při exportu.');
    } finally {
      setIsExportingImporting(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setIsExportingImporting(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            const success = await importChats(content);
            if (success) {
              refreshSessions();
              alert('Historie byla úspěšně importována!');
            } else {
              alert('Chyba při importu. Zkontrolujte formát souboru.');
            }
          } catch (error) {
            alert('Chyba při importu. Zkontrolujte formát souboru.');
          } finally {
            setIsExportingImporting(false);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('cs-CZ', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className={`bg-gray-800 border-r border-gray-600 h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-600">
        <h3 className="text-white font-medium mb-3">Historie chatů</h3>
        
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center justify-center gap-2 mb-3 transition-colors"
        >
          <AiOutlinePlus />
          Nový chat
        </button>
        
        {/* Export/Import Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded text-sm flex items-center justify-center gap-1 transition-colors"
            title="Exportovat historii"
          >
            <AiOutlineDownload size={14} />
            Export
          </button>
          <button
            onClick={handleImport}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded text-sm flex items-center justify-center gap-1 transition-colors"
            title="Importovat historii"
          >
            <AiOutlineUpload size={14} />
            Import
          </button>
        </div>
      </div>
      
      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <div className="text-gray-400 text-center py-8 text-sm">
            Žádné uložené konverzace
          </div>
        ) : (
          sessions
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .map((session) => (
              <div
                key={session.id}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors border ${
                  currentSessionId === session.id
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                }`}
                onClick={() => onSelectSession(session)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {session.title}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      {formatDate(session.updatedAt)}
                    </div>
                    <div className="text-xs opacity-60 mt-1">
                      {session.messages.length} zpráv
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className="ml-2 p-1 rounded hover:bg-red-600 opacity-60 hover:opacity-100 transition-all"
                    title="Smazat konverzaci"
                  >
                    <AiOutlineDelete size={14} />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default ChatHistory;

