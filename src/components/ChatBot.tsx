import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ReconciliationResult {
  firm: string;
  total_lent: number;
  total_paid: number;
  net_balance: number;
  status: 'Balanced' | 'Overpaid' | 'Underpaid';
}

interface ChatBotProps {
  reconciliationResults?: ReconciliationResult[];
}

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;

export const ChatBot: React.FC<ChatBotProps> = ({ reconciliationResults = [] }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: reconciliationResults.length > 0 
        ? "Hello! I can see your reconciliation results. I'm ready to help you analyze the data and provide insights about your loan portfolio. What would you like to know?"
        : "Hello! I'm your AI financial consultant. Ask me anything about reconciliation, finance strategies, budgeting, or financial analysis.",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Update welcome message when reconciliation results change
  useEffect(() => {
    if (reconciliationResults.length > 0) {
      setMessages(prev => {
        const newMessage: Message = {
          id: `analysis-${Date.now()}`,
          text: `I've analyzed your reconciliation data for ${reconciliationResults.length} firms. Here are some key insights:

📊 **Portfolio Summary:**
• Total firms processed: ${reconciliationResults.length}
• Balanced firms: ${reconciliationResults.filter(r => r.status === 'Balanced').length}
• Overpaid firms: ${reconciliationResults.filter(r => r.status === 'Overpaid').length}
• Underpaid firms: ${reconciliationResults.filter(r => r.status === 'Underpaid').length}

💰 **Financial Overview:**
• Total lent: $${reconciliationResults.reduce((sum, r) => sum + r.total_lent, 0).toLocaleString()}
• Total received: $${reconciliationResults.reduce((sum, r) => sum + r.total_paid, 0).toLocaleString()}
• Net difference: $${reconciliationResults.reduce((sum, r) => sum + r.net_balance, 0).toLocaleString()}

Ask me for detailed analysis, risk assessment, or recommendations!`,
          sender: 'bot',
          timestamp: new Date()
        };
        
        return [...prev, newMessage];
      });
    }
  }, [reconciliationResults]);

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
    if (!MISTRAL_API_KEY) {
      console.error("Mistral API key is not set!");
      toast({
        title: "API Configuration Missing",
        description: "Please set your API key in environment variables",
        variant: "destructive",
      });
      return "API configuration is missing. Please check your environment variables.";
    }

    // Prepare context about reconciliation data
    let dataContext = "";
    if (reconciliationResults.length > 0) {
      dataContext = `\n\nCurrent reconciliation data context:
- Total firms: ${reconciliationResults.length}
- Balanced: ${reconciliationResults.filter(r => r.status === 'Balanced').length}
- Overpaid: ${reconciliationResults.filter(r => r.status === 'Overpaid').length}
- Underpaid: ${reconciliationResults.filter(r => r.status === 'Underpaid').length}
- Total lent: $${reconciliationResults.reduce((sum, r) => sum + r.total_lent, 0)}
- Total paid: $${reconciliationResults.reduce((sum, r) => sum + r.total_paid, 0)}
- Net balance: $${reconciliationResults.reduce((sum, r) => sum + r.net_balance, 0)}

Firm details: ${reconciliationResults.map(r => 
  `${r.firm}: Lent $${r.total_lent}, Paid $${r.total_paid}, Balance $${r.net_balance} (${r.status})`
).join('; ')}`;
    }

    try {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          "model": "mistral-large-latest",
          "messages": [
            {
              "role": "system",
              "content": `You are a financial expert AI consultant specializing in loan reconciliation and financial analysis. Answer user questions with professional, concise financial advice including accounting, investment, reconciliation, and strategy. Keep responses clear and actionable.
              
              ${dataContext ? `You have access to current reconciliation data. Use this data to provide specific insights, identify patterns, assess risks, and make recommendations based on the actual financial positions shown.${dataContext}` : ''}`
            },
            {
              "role": "user",
              "content": userMessage
            }
          ],
          "max_tokens": 512,
          "temperature": 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response:', data);
      return data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response at the moment.";
    } catch (error) {
      console.error('API error:', error);
      toast({
        title: "API Error",
        description: "Failed to get response from AI Assistant. Please try again.",
        variant: "destructive",
      });
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

    try {
      const botResponseText = await callMistralAPI(inputValue);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting bot response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col bg-white border shadow-lg overflow-hidden">
      <CardHeader className="py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-5 w-5 text-green-600" />
          Financial AI Consultant
          <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
            Financial AI Assistant
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 p-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'bot' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] p-3 rounded-lg break-words ${
                      message.sender === 'user'
                        ? 'bg-green-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.text}
                    </div>
                    <div className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-green-200' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  {message.sender === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-lg rounded-bl-none">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me any finance-related question..."
              disabled={isLoading}
              className="flex-1 bg-white"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
