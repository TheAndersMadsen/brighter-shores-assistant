import { Button } from '@chakra-ui/react';

function ResetButton() {
  const handleReset = () => {
    // Clear localStorage
    localStorage.removeItem('chatHistory');
    // Reload the page to reset the state
    window.location.reload();
  };

  return (
    <Button
      onClick={handleReset}
      size="xs"
      variant="outline"
      borderColor="whiteAlpha.300"
      color="whiteAlpha.700"
      _hover={{
        borderColor: "red.500",
        color: "red.300"
      }}
    >
      Reset Chat
    </Button>
  );
}

export default ResetButton;
