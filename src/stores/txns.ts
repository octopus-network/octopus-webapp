import create from "zustand"

import { BridgeHistory } from "types"

type TxnsRecord = Record<string, Record<string, BridgeHistory>>

type TxnsStore = {
  txns: TxnsRecord | null
  updateTxn: (appchainId: string, txn: BridgeHistory) => void
  clearTxnsOfAppchain: (appchainId: string) => void
}

const localStorageTxns =
  window.localStorage.getItem("OCTOPUS_BRIDGE_TXNS") || null

export const useTxnsStore = create(
  (set: any, get: any): TxnsStore => ({
    txns: localStorageTxns ? JSON.parse(localStorageTxns) : null,
    updateTxn: (appchainId: string, txn: BridgeHistory) => {
      const txns = get().txns
      const appchainTxns = { ...(txns?.[appchainId] || {}) }

      appchainTxns[txn.hash] = { ...(appchainTxns[txn.hash] || {}), ...txn }

      const newTxns = Object.assign({}, txns, {
        [appchainId]: appchainTxns,
      })

      set({ txns: newTxns })
      window.localStorage.setItem(
        "OCTOPUS_BRIDGE_TXNS",
        JSON.stringify(newTxns)
      )
    },

    clearTxnsOfAppchain: (appchainId: string) => {
      const txns = get().txns
      const newTxns = Object.assign({}, txns, {
        [appchainId]: null,
      })

      set({ txns: newTxns })
      window.localStorage.setItem(
        "OCTOPUS_BRIDGE_TXNS",
        JSON.stringify(newTxns)
      )
    },
  })
)
