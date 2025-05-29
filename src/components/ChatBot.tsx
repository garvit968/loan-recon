import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I’m your AI financial consultant powered by Mistral. Ask me anything about reconciliation, finance strategies, budgeting, or financial analysis.",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callMistralAPI = async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [
            {
              role: "system",
              content: `You are a financial expert AI consultant. Answer user questions with professional, concise financial advice including accounting, investment, reconciliation, and strategy.`
            },
            {
              role: "user",
              content: userMessage
            }
          ]
        })
      });

      const data = await response.json();
      console.log(data)
      return data.choices?.[0]?.message?.content || "Sorry, I couldn’t generate a response at the moment.";
    } catch (error) {
      console.error('Mistral API error:', error);
      return "Sorry, I'm facing technical difficulties. Please try again.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const botResponseText = await callMistralAPI(inputValue);

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponseText,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4 text-green-600" />
          Financial Advisor Chatbot (Mistral)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 p-3">
        <ScrollArea className="flex-1 pr-3" ref={scrollAreaRef}>
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'bot' && <Bot className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />}
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  {message.text}
                </div>
                {message.sender === 'user' && <User className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2 justify-start">
                <Bot className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div className="bg-gray-100 text-gray-900 p-3 rounded-lg text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 mt-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me any finance-related question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
