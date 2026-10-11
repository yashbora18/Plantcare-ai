import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AiStatusContext = createContext();

export function AiStatusProvider({ children }) {
  const [aiStatus, setAiStatus] = useState({
    available: false,
    configured_model: 'llama3.2',
    configured_vision_model: 'llama3.2-vision',
    model_ready: false,
    vision_ready: false,
    installed_models: [],
    loading: true,
    error: null,
  });

  const checkStatus = useCallback(async () => {
    try {
      const data = await api.getAiStatus();
      setAiStatus({
        ...data,
        loading: false,
        error: data.available ? null : data.error,
      });
      return data;
    } catch (err) {
      setAiStatus(prev => ({
        ...prev,
        available: false,
        loading: false,
        error: err.message || 'Cannot connect to backend or Ollama',
      }));
      return { available: false };
    }
  }, []);

  useEffect(() => {
    checkStatus();
    // Poll every 45 seconds to keep status indicator current
    const interval = setInterval(checkStatus, 45000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <AiStatusContext.Provider value={{ aiStatus, checkStatus }}>
      {children}
    </AiStatusContext.Provider>
  );
}

export function useAiStatus() {
  const context = useContext(AiStatusContext);
  if (!context) {
    throw new Error('useAiStatus must be used within an AiStatusProvider');
  }
  return context;
}
