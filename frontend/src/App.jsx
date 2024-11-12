import { ChakraProvider, Box, Heading, Container, HStack } from '@chakra-ui/react';
import { extendTheme } from '@chakra-ui/react';
import Chat from './components/Chat';
import ResetButton from './components/ResetButton';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: '#1a1b1e',
        color: '#ffffff',
      },
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  components: {
    Container: {
      baseStyle: {
        maxW: { base: '100%', md: '90%', lg: '80%', xl: '1200px' },
        px: { base: '4', md: '6', lg: '8' },
      },
    },
  },
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" w="100vw" display="flex" flexDirection="column">
        <Container flex="1" display="flex" flexDirection="column">
          <Box py={{ base: 3, md: 4 }} borderBottom="1px solid" borderColor="whiteAlpha.200">
            <Heading size={{ base: 'lg', md: 'xl' }} textAlign="center" mb={3}>
              Brighter Shores Assistant
            </Heading>
            <Box display="flex" justifyContent="center">
              <ResetButton />
            </Box>
          </Box>
          <Box flex="1" display="flex" flexDirection="column">
            <Chat />
          </Box>
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App;