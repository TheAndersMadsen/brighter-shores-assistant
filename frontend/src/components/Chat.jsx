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
import { askQuestionStream } from '../services/api';

const MessageType = {
  USER: 'user',
  ASSISTANT: 'assistant'
};

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
    
    // Add user message to chat
    const userMessageObj = { 
      text: userMessage, 
      isUser: true
    };
    setMessages(prev => [...prev, userMessageObj]);
    setIsLoading(true);

    try {
      // Build context with clear role indicators
      const context = messages
        .map(msg => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`)
        .join('\n');

      const fullQuestion = context 
        ? `Previous conversation:\n${context}\n\nUser: ${userMessage}`
        : `User: ${userMessage}`;

      // Create assistant message placeholder
      const assistantMessageObj = { 
        text: '', 
        isUser: false,
        sources: []
      };
      setMessages(prev => [...prev, assistantMessageObj]);

      const tempMessageIndex = messages.length + 1;

      const { sources } = await askQuestionStream(fullQuestion, (chunk) => {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[tempMessageIndex] = {
            ...newMessages[tempMessageIndex],
            text: newMessages[tempMessageIndex].text + chunk,
            isUser: false
          };
          return newMessages;
        });
      });

      // Update sources after stream completes
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[tempMessageIndex] = {
          ...newMessages[tempMessageIndex],
          isUser: false,
          sources: sources?.slice(0, 4).filter((source, index, self) =>
            index === self.findIndex((s) => s.url === source.url)
          ) || []
        };
        return newMessages;
      });
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