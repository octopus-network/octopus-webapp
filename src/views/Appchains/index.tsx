import React, { useMemo, useEffect } from "react"

import {
  Container,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  Box,
  SimpleGrid,
  Image,
  Link,
} from "@chakra-ui/react"

import { RunningAppchains } from "components"

import { Statistics } from "./Statistics"
import { Booting } from "./Booting"
import { Voting } from "./Voting"
import { Established } from "./Established"

import { Overview } from "./Overview"
import { useParams, useNavigate } from "react-router-dom"
import JOIN_DISCORD from "../../assets/join-discord.png"
import JOIN_ACCELERATOR from "../../assets/join-accelerator.png"
import JOIN_OCTOPUS from "../../assets/join-octopus.png"
import { useWalletSelector } from "components/WalletSelectorContextProvider"

export const Appchains: React.FC = () => {
  const { appchainId } = useParams()
  const navigate = useNavigate()

  const drawerIOpen = useMemo(() => !!appchainId, [appchainId])

  useEffect(() => {
    if (drawerIOpen) {
      ;(document.getElementById("root") as any).style =
        "transition: all .3s ease-in-out; transform: translateX(-15%)"
    } else {
      ;(document.getElementById("root") as any).style =
        "transition: all .15s ease-in-out; transform: translateX(0)"
    }
  }, [drawerIOpen])

  const onDrawerClose = () => {
    navigate(`/appchains`)
  }

  const { networkConfig } = useWalletSelector()
  const isMainnet = networkConfig?.near.networkId === "mainnet"

  return (
    <>
      <Container>
        <Box mt={10} display={{ base: "none", md: "block" }}>
          <SimpleGrid gap={3} mt={1} columns={{ base: 1, md: 3 }}>
            <Link href="/register">
              <Image src={JOIN_OCTOPUS} borderRadius={10} />
            </Link>
            <Link
              href={
                isMainnet
                  ? "https://discord.gg/BEQrN4Ya7C"
                  : "https://discord.gg/zgcdhu5BzT"
              }
              target="_blank"
            >
              <Image src={JOIN_DISCORD} borderRadius={10} />
            </Link>
            <Link href="https://accelerator.oct.network/" target="_blank">
              <Image src={JOIN_ACCELERATOR} borderRadius={10} />
            </Link>
          </SimpleGrid>
        </Box>
        <Box mt={10}>
          <RunningAppchains showMore={false} />
        </Box>
        <Box mt={10}>
          <Statistics />
        </Box>
        <Box mt={10}>
          <Booting />
        </Box>
        <Box mt={10}>
          <Voting />
        </Box>
        <Box mt={10}>
          <Established />
        </Box>
      </Container>
      <Drawer
        placement="right"
        isOpen={drawerIOpen}
        onClose={onDrawerClose}
        size="lg"
      >
        <DrawerOverlay />
        <DrawerContent>
          <Overview appchainId={appchainId} onDrawerClose={onDrawerClose} />
        </DrawerContent>
      </Drawer>
    </>
  )
}
