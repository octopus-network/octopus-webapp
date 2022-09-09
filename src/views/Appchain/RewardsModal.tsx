import React from "react"

import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@chakra-ui/react"

import {
  AppchainInfoWithAnchorStatus,
  RewardHistory,
  AnchorContract,
} from "types"

import { BaseModal } from "components"
import { ZERO_DECIMAL } from "utils"

import RewardList from "components/AppChain/RewardList"
import { calcUnwithdrawnReward } from "utils/appchain"

type RewardsModalProps = {
  validatorRewards?: RewardHistory[]
  delegatorRewards?: {
    [key: string]: RewardHistory[]
  }
  appchain?: AppchainInfoWithAnchorStatus
  anchor?: AnchorContract
  validatorId?: string
  isOpen: boolean
  onClose: () => void
}

export const RewardsModal: React.FC<RewardsModalProps> = ({
  isOpen,
  onClose,
  validatorRewards,
  appchain,
  anchor,
  validatorId,
  delegatorRewards = {},
}) => {
  const decimals =
    appchain?.appchain_metadata?.fungible_token_metadata?.decimals

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxW="800px" title={"Rewards"}>
      <Tabs variant="enclosed">
        <TabList>
          <Tab>Validator Reward</Tab>
          <Tab>Delegator Reward</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <RewardList
              rewards={validatorRewards || []}
              appchain={appchain}
              anchor={anchor}
              validatorId={validatorId}
            />
          </TabPanel>
          <TabPanel>
            <Tabs>
              <TabList>
                {Object.keys(delegatorRewards).map((key) => {
                  const unwithdrawnReward = calcUnwithdrawnReward(
                    delegatorRewards[key] || [],
                    decimals
                  )
                  if (unwithdrawnReward.gt(ZERO_DECIMAL)) {
                    return <Tab key={key}>{key}</Tab>
                  }
                  return null
                })}
              </TabList>
              <TabPanels>
                {Object.keys(delegatorRewards).map((key) => {
                  const unwithdrawnReward = calcUnwithdrawnReward(
                    delegatorRewards[key] || [],
                    decimals
                  )
                  if (unwithdrawnReward.gt(ZERO_DECIMAL)) {
                    return (
                      <TabPanel key={key}>
                        <RewardList
                          rewards={delegatorRewards[key] || []}
                          appchain={appchain}
                          anchor={anchor}
                          validatorId={key}
                        />
                      </TabPanel>
                    )
                  }
                  return null
                })}
              </TabPanels>
            </Tabs>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </BaseModal>
  )
}
