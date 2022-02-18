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
  const [isLoging, setIsLoging] = useBoolean();

  const onLogin = (e: any) => {
    setIsLoging.on();
    global.wallet?.requestSignIn(global.network?.octopus.registryContractId, 'Octopus Webapp');
  }

  return (
    <Button variant="octo-linear" onClick={onLogin} 
      isLoading={isLoging} isDisabled={isLoging}>
      <Icon as={AiOutlineUser} boxSize={5} mr={2} /> Login
    </Button>
  );
}