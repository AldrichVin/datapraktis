'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Loader2,
  MessageSquare,
  Send,
  ArrowLeft,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  image: string | null;
  role: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: User;
}

interface Conversation {
  id: string;
  project: {
    id: string;
    title: string;
    status: string;
  };
  otherUser: User;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
}

interface ConversationDetail extends Conversation {
  messages: Message[];
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch conversations
  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch('/api/conversations');
        const data = await res.json();
        if (data.success) {
          setConversations(data.data);

          // Check if there's a project query param to auto-select conversation
          const projectId = searchParams.get('project');
          if (projectId) {
            const conv = data.data.find(
              (c: Conversation) => c.project.id === projectId
            );
            if (conv) {
              selectConversation(conv.id);
            }
          }
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Gagal memuat percakapan',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingConversations(false);
      }
    }
    fetchConversations();
  }, [searchParams, toast]);

  // Get current user ID
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data?.user?.id) {
          setCurrentUserId(data.user.id);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    }
    fetchUser();
  }, []);

  // Poll for new messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/conversations/${selectedConversation.id}`);
        const data = await res.json();
        if (data.success) {
          setSelectedConversation(data.data);
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [selectedConversation?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages, scrollToBottom]);

  const selectConversation = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedConversation(data.data);

        // Update unread count in list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          )
        );

        // Focus input
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat pesan',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    const messageContent = newMessage;
    setNewMessage('');

    try {
      const res = await fetch(
        `/api/conversations/${selectedConversation.id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: messageContent }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Add message to list
      setSelectedConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, data.data],
            }
          : null
      );

      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? {
                ...c,
                lastMessage: {
                  id: data.data.id,
                  content: data.data.content,
                  createdAt: data.data.createdAt,
                  senderId: data.data.senderId,
                },
              }
            : c
        )
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal mengirim pesan',
        variant: 'destructive',
      });
      setNewMessage(messageContent); // Restore message
    } finally {
      setIsSending(false);
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex h-full border rounded-lg overflow-hidden">
        {/* Conversation List */}
        <div
          className={cn(
            'w-full md:w-80 border-r flex flex-col',
            selectedConversation && 'hidden md:flex'
          )}
        >
          <div className="p-4 border-b">
            <h2 className="font-semibold">Pesan</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada percakapan</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={cn(
                    'w-full p-4 text-left hover:bg-muted/50 transition-colors border-b',
                    selectedConversation?.id === conversation.id && 'bg-muted'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={conversation.otherUser?.image || ''} />
                      <AvatarFallback>
                        {conversation.otherUser?.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {conversation.otherUser?.name}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge className="ml-2">{conversation.unreadCount}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.project.title}
                      </p>
                      {conversation.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Area */}
        <div
          className={cn(
            'flex-1 flex flex-col',
            !selectedConversation && 'hidden md:flex'
          )}
        >
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Pilih percakapan untuk memulai</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar>
                  <AvatarImage src={selectedConversation.otherUser?.image || ''} />
                  <AvatarFallback>
                    {selectedConversation.otherUser?.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedConversation.otherUser?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.project.title}
                  </p>
                </div>
                <Badge
                  variant={
                    selectedConversation.project.status === 'IN_PROGRESS'
                      ? 'default'
                      : selectedConversation.project.status === 'COMPLETED'
                      ? 'success'
                      : 'secondary'
                  }
                >
                  {selectedConversation.project.status === 'IN_PROGRESS'
                    ? 'Aktif'
                    : selectedConversation.project.status === 'COMPLETED'
                    ? 'Selesai'
                    : selectedConversation.project.status}
                </Badge>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {selectedConversation.messages.map((message) => {
                      const isOwn = message.senderId === currentUserId;
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            'flex gap-3',
                            isOwn && 'flex-row-reverse'
                          )}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.sender.image || ''} />
                            <AvatarFallback>
                              {message.sender.name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              'max-w-[70%]',
                              isOwn && 'text-right'
                            )}
                          >
                            <div
                              className={cn(
                                'rounded-lg px-4 py-2 inline-block',
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatRelativeTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              {selectedConversation.project.status === 'IN_PROGRESS' && (
                <form onSubmit={sendMessage} className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Ketik pesan..."
                      disabled={isSending}
                    />
                    <Button type="submit" disabled={!newMessage.trim() || isSending}>
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {selectedConversation.project.status !== 'IN_PROGRESS' && (
                <div className="p-4 border-t bg-muted/50 text-center text-sm text-muted-foreground">
                  Proyek sudah selesai. Pesan tidak dapat dikirim.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
