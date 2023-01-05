import React from "react";

import {
  Modal,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalContent,
  ModalOverlay,
} from "@chakra-ui/react";

export type BaseModalProps = {
  isOpen: boolean;
  onClose: VoidFunction;
  isCentered?: boolean;
  children?: React.ReactElement | React.ReactElement[];
  maxW?: number | string;
  title?: string;
};

export const BaseModal: React.FC<BaseModalProps> = (props) => {
  const { isOpen, onClose, maxW, children, isCentered, title } = props;

  return (
    <Modal
      isOpen={isOpen}
      isCentered={isCentered !== undefined ? isCentered : true}
      motionPreset="slideInBottom"
      onClose={onClose}
    >
      <ModalOverlay className="backdrop-blur transition" />
      <ModalContent ml={3} mr={3} maxW={maxW} borderRadius="md">
        {title ? (
          <ModalHeader
            maxW="calc(100% - 60px)"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
            overflow="hidden"
          >
            {title}
          </ModalHeader>
        ) : null}
        <ModalCloseButton />
        <ModalBody pb={6}>{children}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
