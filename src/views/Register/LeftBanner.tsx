import React from "react";

import { Box, Heading, Text, Image } from "@chakra-ui/react";

import bigBubble from "assets/big-bubble.png";
import smallBubble from "assets/small-bubble.png";
import web3Card from "assets/web3-card.png";

export const LeftBanner: React.FC = () => {
  return (
    <Box
      borderRadius="md"
      bg="#1486ff"
      h="100%"
      p={6}
      position="relative"
      color="white"
      overflow="hidden"
      w="100%"
    >
      <Heading fontSize="3xl" mt={3}>
        Octopus Network
      </Heading>
      <Box mt={3}>
        <Text fontSize="lg" opacity=".7">
          A more flexible multi-chain network
        </Text>
      </Box>
      <Box position="absolute" w="28px" top="50%" right="50%" zIndex={2}>
        <Image src={smallBubble} w="100%" />
      </Box>
      <Box position="absolute" w="20%" top="120px" right="-7%" zIndex={2}>
        <Image src={smallBubble} w="100%" />
      </Box>
      <Box position="absolute" w="85%" bottom="-80px" left="-50px" zIndex={2}>
        <Image src={bigBubble} w="100%" />
      </Box>
      <Box
        position="absolute"
        w="60%"
        bottom="-80px"
        right="-30px"
        zIndex={1}
        opacity=".3"
      >
        <Image src={bigBubble} w="100%" />
      </Box>
      <Box position="absolute" w="50%" bottom="130px" left="30%" zIndex={3}>
        <Image src={web3Card} w="100%" />
        <Box position="absolute" w="30%">
          <Image src={smallBubble} w="100%" />
        </Box>
      </Box>
    </Box>
  );
};
