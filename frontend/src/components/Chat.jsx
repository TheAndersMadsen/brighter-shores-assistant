import { useState, useEffect } from 'react';
import {
  Box,
  Input,
  Button,
  VStack,
  Container,
  InputGroup,
  InputRightElement,
  HStack,
} from '@chakra-ui/react';
import ChatMessage from './ChatMessage';
import { askQuestion } from '../services/api';

function Chat() {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setIsLoading(true);

    try {
      const context = messages
        .map(msg => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`)
        .join('\n');
      
      const fullQuestion = context 
        ? `Previous conversation:\n${context}\n\nCurrent question: ${userMessage}`
        : userMessage;

      const response = await askQuestion(fullQuestion);
      const uniqueSources = response.sources.filter((source, index, self) =>
        index === self.findIndex((s) => s.url === source.url)
      );
      
      setMessages(prev => [...prev, { 
        text: response.answer, 
        isUser: false,
        sources: uniqueSources
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        text: "Sorry, I encountered an error. Please try again.", 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" flex="1" h="100%">
      <VStack 
        flex="1" 
        spacing={0} 
        overflowY="auto" 
        mb={4}
        w="100%"
        sx={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'whiteAlpha.300',
            borderRadius: '24px',
          },
        }}
      >
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message.text}
            isUser={message.isUser}
            sources={message.sources}
          />
        ))}
      </VStack>
      <Box 
        borderTop="1px solid" 
        borderColor="whiteAlpha.200" 
        p={{ base: 3, md: 4 }}
        bg="#1a1b1e"
        width="100%"
      >
        <Container maxW={{ base: '100%', md: '90%', lg: '80%', xl: '1200px' }}>
          <form onSubmit={handleSubmit}>
            <InputGroup size={{ base: "md", md: "lg" }}>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Brighter Shores..."
                disabled={isLoading}
                bg="whiteAlpha.100"
                border="1px solid"
                borderColor="whiteAlpha.300"
                fontSize={{ base: 'sm', md: 'md' }}
                px={4}
                _hover={{
                  borderColor: "whiteAlpha.400"
                }}
                _focus={{
                  borderColor: "blue.500",
                  boxShadow: "0 0 0 1px #3182ce"
                }}
              />
              <InputRightElement width={{ base: "4rem", md: "5rem" }} pr={2}>
                <Button
                  h={{ base: "1.5rem", md: "1.75rem" }}
                  size="sm"
                  type="submit"
                  isLoading={isLoading}
                  disabled={!input.trim() || isLoading}
                  colorScheme="blue"
                  fontSize={{ base: 'xs', md: 'sm' }}
                >
                  Send
                </Button>
              </InputRightElement>
            </InputGroup>
          </form>
        </Container>
      </Box>
    </Box>
  );
}

export default Chat;