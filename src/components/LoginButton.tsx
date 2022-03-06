import React from 'react';

import {
  Button,
  useBoolean,
  Icon
} from '@chakra-ui/react';

import { AiOutlineUser } from 'react-icons/ai';
import { useGlobalStore } from 'stores';

export const LoginButton: React.FC = () => {

  const { global } = useGlobalStore();
  const [isLogging, setIsLogging] = useBoolean();

  const onLogin = (e: any) => {
    setIsLogging.on();
    global.wallet?.requestSignIn(global.network?.octopus.registryContractId, 'Octopus Webapp');
  }

  return (
    <Button variant="octo-linear" onClick={onLogin} 
      isLoading={isLogging} isDisabled={isLogging}>
      <Icon as={AiOutlineUser} boxSize={5} mr={2} /> Login
    </Button>
  );
}