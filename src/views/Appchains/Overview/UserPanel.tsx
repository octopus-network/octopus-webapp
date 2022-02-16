import React, { useMemo } from 'react';
import { AppchainInfo } from 'types';

import { VoteActions } from './VoteActions';

type UserPanelProps = {
  data: AppchainInfo | undefined;
}

export const UserPanel: React.FC<UserPanelProps> = ({ data }) => {

  return (
    <>
    {
      data?.appchain_state === 'InQueue' ?
      <VoteActions data={data} /> : null
    }
    </>
  );
}