import { Message } from 'ai';
import { supabase } from '@/lib/supabase';

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

// Get user ID (simple browser fingerprint for now)
function getUserId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let userId = localStorage.getItem('pinecone-user-id');
  if (!userId) {
    userId = generateSessionId();
    localStorage.setItem('pinecone-user-id', userId);
  }
  return userId;
}

// Get all chat sessions from Supabase
export async function getChatSessions(): Promise<ChatSession[]> {
  try {
    const userId = getUserId();
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
    
    return (data || []).map(session => ({
      id: session.id,
      title: session.title,
      messages: session.messages,
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.updated_at),
      userId: session.user_id
    }));
  } catch (error) {
    console.error('Error loading chat sessions:', error);
    return [];
  }
}

// Save chat session to Supabase
export async function saveChatSession(session: ChatSession): Promise<boolean> {
  try {
    const userId = getUserId();
    const now = new Date().toISOString();
    
    const sessionData = {
      id: session.id,
      title: session.title,
      messages: session.messages,
      user_id: userId
    };
    
    const { error } = await supabase
      .from('chat_sessions')
      .upsert(sessionData, {
        onConflict: 'id'
      });
    
    if (error) {
      console.error('Error saving chat session:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving chat session:', error);
    return false;
  }
}

// Delete chat session from Supabase
export async function deleteChatSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);
    
    if (error) {
      console.error('Error deleting chat session:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return false;
  }
}

// Generate chat title from first message
export function generateChatTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'Nová konverzace';
  
  const content = firstUserMessage.content.trim();
  if (content.length <= 50) return content;
  return content.substring(0, 47) + '...';
}

// Generate unique ID
export function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Export all chats to JSON
export async function exportChats(): Promise<string> {
  const sessions = await getChatSessions();
  return JSON.stringify(sessions, null, 2);
}

// Import chats from JSON
export async function importChats(jsonData: string): Promise<boolean> {
  try {
    const imported = JSON.parse(jsonData);
    if (!Array.isArray(imported)) throw new Error('Invalid format');
    
    // Save each imported session to Supabase
    const promises = imported.map(session => saveChatSession({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt)
    }));
    
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Error importing chats:', error);
    return false;
  }
}

