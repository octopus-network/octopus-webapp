import React from 'react';

import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button
} from '@chakra-ui/react';

type AlertProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  isConfirming?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
}

export const Alert: React.FC<AlertProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  confirmButtonText, 
  cancelButtonText, 
  onConfirm, 
  confirmButtonColor,
  isConfirming
}) => {
  const cancelRef = React.useRef<any>();

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize='lg' fontWeight='bold'>
            {title}
          </AlertDialogHeader>

          <AlertDialogBody>{message}</AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              {cancelButtonText || 'Cancel'}
            </Button>
            <Button colorScheme={confirmButtonColor || 'octo-blue'} onClick={onConfirm} ml={3} isLoading={isConfirming} disabled={isConfirming}>
              {confirmButtonText || 'Ok'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}