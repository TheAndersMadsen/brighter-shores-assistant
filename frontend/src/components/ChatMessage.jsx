import { Box, Container, Link, Text, VStack } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';

export const ChatMessage = ({ message, isUser, sources }) => {
  return (
    <Box
      w="100%"
      bg={isUser ? 'transparent' : 'whiteAlpha.50'}
      py={{ base: 4, md: 6 }}
    >
      <Container maxW={{ base: '100%', md: '90%', lg: '80%', xl: '1200px' }}>
        <Box
          display="flex"
          gap={{ base: 3, md: 4 }}
          px={{ base: 2, md: 4 }}
        >
          <Box
            w={{ base: '24px', md: '30px' }}
            h={{ base: '24px', md: '30px' }}
            flexShrink={0}
            borderRadius="md"
            bg={isUser ? 'blue.500' : 'green.500'}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize={{ base: 'xs', md: 'sm' }}
            fontWeight="bold"
          >
            {isUser ? 'U' : 'A'}
          </Box>
          <VStack align="stretch" flex="1" spacing={3}>
            <Box className="markdown-content" color="gray.100">
              <ReactMarkdown>{message}</ReactMarkdown>
            </Box>
            {!isUser && sources && sources.length > 0 && (
              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>
                  Sources:
                </Text>
                <VStack align="stretch" spacing={1}>
                  {sources.map((source, index) => (
                    <Link
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      fontSize="sm"
                      color="blue.300"
                      _hover={{ color: 'blue.200', textDecoration: 'underline' }}
                    >
                      {source.title}
                    </Link>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default ChatMessage; 