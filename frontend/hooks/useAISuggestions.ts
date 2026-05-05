import { useState, useCallback, useRef } from "react";

// In a real app this would come from process.env.NEXT_PUBLIC_API_URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export function useAISuggestions() {
  const [suggestion, setSuggestion] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const generateSuggestion = useCallback((message: string) => {
    // Reset state
    setSuggestion("");
    setIsGenerating(true);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const encodedMessage = encodeURIComponent(
      `Based on the client's message: "${message}", suggest a polite and helpful response for the sales agent.`
    );
    
    const url = `${API_URL}/ai/suggest?message=${encodedMessage}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      // EventSource data comes in chunks
      // Usually Spring AI sends data tokens as plain text
      const newText = event.data;
      setSuggestion((prev) => prev + newText);
    };

    es.onerror = (error) => {
      console.log("[SSE] Stream ended or errored");
      setIsGenerating(false);
      es.close();
    };

  }, []);

  const stopGeneration = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      setIsGenerating(false);
    }
  }, []);

  return { suggestion, isGenerating, generateSuggestion, stopGeneration };
}
