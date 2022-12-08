import { Container } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import policyText from "./policyText";

export default function Policy() {
  return (
    <Container>
      <ReactMarkdown children={policyText} remarkPlugins={[remarkGfm]} />
    </Container>
  );
}
