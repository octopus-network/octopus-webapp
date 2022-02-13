const NETWORK = process.env.REACT_APP_OCT_NETWORK || 'testnet';

export const REGISTRY_CONTRACT_ID = process.env.REACT_APP_OCT_REGISTRY_CONTRACT || 'registry.test_oct.testnet';

export const octopus = {
  explorerUrl: `https://explorer.${NETWORK}.oct.network`
}