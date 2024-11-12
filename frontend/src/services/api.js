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