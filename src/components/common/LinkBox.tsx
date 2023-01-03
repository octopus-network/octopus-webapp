import { Box, Text, VStack } from "@chakra-ui/react";
import React from "react";

type LinkBoxProps = {
  label: string;
  icon: React.ReactElement;
  to?: string;
  href?: string;
};

const LinkBox: React.FC<LinkBoxProps> = ({ label, icon }) => {
  return (
    <Box p={4} cursor="pointer">
      <VStack spacing={1}>
        {icon}
        <Text
          fontSize={12}
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          overflow="hidden"
          maxW="100%"
        >
          {label}
        </Text>
      </VStack>
    </Box>
  );
};

export default LinkBox;
