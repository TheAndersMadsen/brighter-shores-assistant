import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : 'http://localhost:3000/api';

export const askQuestion = async (question, onChunk) => {
  try {
    const response = await fetch(`${API_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error('Failed to get response');
  }
};

export const refreshKnowledge = async () => {
  try {
    const response = await axios.post(`${API_URL}/refresh`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to refresh knowledge base');
  }
};

export const askQuestionStream = async (question, onChunk) => {
  try {
    const response = await fetch(`${API_URL}/ask/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let sources = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.sources) {
              sources = parsed.sources;
            } else if (parsed.text) {
              onChunk(parsed.text);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }

    return { sources };
  } catch (error) {
    console.error('Stream error:', error);
    throw new Error('Failed to get response');
  }
};