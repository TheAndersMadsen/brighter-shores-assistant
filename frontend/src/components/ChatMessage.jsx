import { Box, Container, Link, Text, VStack } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import PropTypes from 'prop-types';

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
          alignItems="flex-start"
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
          <Box flex="1">
            <Box 
              className="markdown-content" 
              color="gray.100"
              sx={{
                '& p': {
                  marginBottom: '1em',
                  lineHeight: '1.6'
                },
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                  fontWeight: 'bold',
                  marginTop: '1.5em',
                  marginBottom: '0.5em'
                },
                '& h1': { fontSize: '1.5em' },
                '& h2': { fontSize: '1.3em' },
                '& h3': { fontSize: '1.1em' },
                '& code': {
                  backgroundColor: 'whiteAlpha.200',
                  padding: '0.2em 0.4em',
                  borderRadius: '0.3em',
                  fontSize: '0.9em',
                  fontFamily: 'monospace'
                },
                '& pre': {
                  backgroundColor: 'whiteAlpha.200',
                  padding: '1em',
                  borderRadius: '0.5em',
                  overflow: 'auto',
                  marginBottom: '1em',
                  '& code': {
                    backgroundColor: 'transparent',
                    padding: 0,
                    color: 'gray.100'
                  }
                },
                '& ol, & ul': {
                  paddingLeft: '1.5em',
                  marginBottom: '1em',
                  '& li': {
                    marginBottom: '0.5em',
                    position: 'relative',
                    paddingLeft: '0.5em'
                  }
                },
                '& ol': {
                  listStyleType: 'decimal',
                  '& li::marker': {
                    color: 'gray.400'
                  }
                },
                '& ul': {
                  listStyleType: 'disc',
                  '& li::marker': {
                    color: 'gray.400'
                  }
                },
                '& blockquote': {
                  borderLeft: '3px solid',
                  borderColor: 'whiteAlpha.300',
                  paddingLeft: '1em',
                  marginLeft: 0,
                  marginBottom: '1em',
                  color: 'gray.300'
                },
                '& a': {
                  color: 'blue.300',
                  textDecoration: 'underline',
                  _hover: {
                    color: 'blue.200'
                  }
                },
                '& table': {
                  width: '100%',
                  marginBottom: '1em',
                  borderCollapse: 'collapse',
                  '& th, & td': {
                    border: '1px solid',
                    borderColor: 'whiteAlpha.200',
                    padding: '0.5em'
                  },
                  '& th': {
                    backgroundColor: 'whiteAlpha.100',
                    fontWeight: 'bold'
                  }
                }
              }}
            >
              <ReactMarkdown>{message}</ReactMarkdown>
            </Box>
            {!isUser && sources && sources.length > 0 && (
              <Box mt={3}>
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
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

ChatMessage.propTypes = {
  message: PropTypes.string.isRequired,
  isUser: PropTypes.bool.isRequired,
  sources: PropTypes.arrayOf(PropTypes.shape({
    url: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  }))
};

export default ChatMessage; 