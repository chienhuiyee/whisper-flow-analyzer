
import React, { useState } from 'react';
import { Send, MessageSquare, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
}

interface Analysis {
  id: string;
  question: string;
  result: any;
  timestamp: Date;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    if (!webhookUrl.trim()) {
      toast({
        title: "Webhook URL Required",
        description: "Please enter your N8N webhook URL first",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      timestamp: new Date(),
      isUser: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      console.log("Sending request to N8N webhook:", webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: inputValue,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received analysis:", data);

      // Add analysis to the right panel
      const newAnalysis: Analysis = {
        id: Date.now().toString(),
        question: inputValue,
        result: data,
        timestamp: new Date(),
      };

      setAnalyses(prev => [...prev, newAnalysis]);

      // Add system response to chat
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Analysis completed and displayed in the right panel",
        timestamp: new Date(),
        isUser: false,
      };

      setMessages(prev => [...prev, systemMessage]);

      toast({
        title: "Analysis Complete",
        description: "Your question has been processed successfully",
      });

    } catch (error) {
      console.error("Error calling N8N webhook:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, there was an error processing your request. Please check your webhook URL and try again.",
        timestamp: new Date(),
        isUser: false,
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setInputValue('');
    }
  };

  const formatAnalysisResult = (result: any) => {
    if (typeof result === 'string') {
      return result;
    }
    return JSON.stringify(result, null, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 h-screen flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Whisper Flow Analyzer
          </h1>
          <p className="text-gray-600 text-center mb-4">
            Ask questions and get instant analysis from your N8N workflow
          </p>
          
          {/* Webhook URL Input */}
          <div className="max-w-2xl mx-auto">
            <Input
              type="url"
              placeholder="Enter your N8N webhook URL..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full bg-white/70 backdrop-blur-sm border-white/20 shadow-lg"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          {/* Left Panel - Chat */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-center mb-4">
                <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">Chat</h2>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-0">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Start a conversation by typing your question below</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.isUser
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-bl-sm flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">Processing your request...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your question here..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right Panel - Analysis Results */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">Analysis Results</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
                {analyses.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Analysis results will appear here after you send a question</p>
                  </div>
                ) : (
                  analyses.map((analysis, index) => (
                    <div
                      key={analysis.id}
                      className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200/50 animate-in slide-in-from-right duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-800 text-sm">
                          Question #{analyses.length - index}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {analysis.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 font-medium mb-1">Asked:</p>
                        <p className="text-sm text-gray-600 italic">"{analysis.question}"</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-700 font-medium mb-1">Analysis:</p>
                        <pre className="text-xs text-gray-600 bg-white/50 p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                          {formatAnalysisResult(analysis.result)}
                        </pre>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
