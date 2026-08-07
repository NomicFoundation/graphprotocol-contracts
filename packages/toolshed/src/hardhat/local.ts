import type { HardhatEthersProvider } from '@nomicfoundation/hardhat-ethers/types'

const localNetworks = ['localhost', 'localNetwork', 'node', 'default']

export function requireLocalNetwork(networkName: string) {
  if (!localNetworks.includes(networkName)) {
    throw new Error(`Network ${networkName} is not a local network.`)
  }
}

export async function warp(provider: HardhatEthersProvider, seconds: number) {
  await provider.send('evm_increaseTime', [seconds])
  await provider.send('evm_mine', [])
}

export async function mine(provider: HardhatEthersProvider, blocks: number) {
  for (let i = 0; i < blocks; i++) {
    await provider.send('evm_mine', [])
  }
}
