import React from 'react'
import { AppchainInfo } from 'types'

import { VoteActions } from './VoteActions'

type UserPanelProps = {
  data: AppchainInfo | undefined
}

export const UserPanel: React.FC<UserPanelProps> = ({ data }) => {
  return (
    <>
      {data?.appchain_state === 'InQueue' ||
      data?.appchain_state === 'Staging' ||
      data?.appchain_state === 'Booting' ? (
        <VoteActions data={data} />
      ) : null}
    </>
  )
}
