import { Button } from '@chakra-ui/react';
import { useState } from 'react';
import { refreshKnowledge } from '../services/api';


function RefreshButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshKnowledge();
    } catch (error) {
      console.error('Error refreshing knowledge base:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRefresh}
      isLoading={isLoading}
      loadingText="Refreshing..."
      size="xs"
      variant="outline"
      borderColor="whiteAlpha.300"
      color="whiteAlpha.700"
      _hover={{
        borderColor: "whiteAlpha.500",
        color: "white"
      }}
    >
      Refresh Knowledge Base
    </Button>
  );
}

export default RefreshButton;