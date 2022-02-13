const NETWORK = process.env.REACT_APP_OCT_NETWORK || 'testnet';

export const near = {
  networkId: NETWORK,
  nodeUrl: `https://rpc.${NETWORK}.near.org`,
  archivalUrl: `https://archival-rpc.${NETWORK}.near.org`,
  walletUrl: `https://wallet.${NETWORK}.near.org`,
  helperUrl: `https://helper.${NETWORK}.near.org`,
  explorerUrl: `https://explorer.${NETWORK}.near.org`,
  headers: {}
}
