import { Container } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChakraUIRenderer from "chakra-ui-markdown-renderer";
import policyText from "./policyText";

export default function Policy() {
  return (
    <Container>
      <ReactMarkdown
        components={ChakraUIRenderer()}
        children={policyText}
        remarkPlugins={[remarkGfm]}
      />
    </Container>
  );
}
