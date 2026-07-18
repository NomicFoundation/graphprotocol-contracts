import type { HardhatEthersProvider } from '@nomicfoundation/hardhat-ethers/types'
import type { Provider, Signer } from 'ethers'

import { resolveAddressBook } from '../../lib/resolve.js'
import { loadActions } from './actions.js'
import { SubgraphServiceAddressBook } from './address-book.js'
import type { SubgraphServiceContracts } from './contracts.js'

export { SubgraphServiceAddressBook }
export type { SubgraphServiceContractName, SubgraphServiceContracts } from './contracts.js'
export { SubgraphServiceContractNameList } from './contracts.js'

export function loadSubgraphService(addressBookPath: string, chainId: number, provider: HardhatEthersProvider) {
  const addressBook = new SubgraphServiceAddressBook(addressBookPath, chainId)
  const contracts = addressBook.loadContracts(provider, true)
  return {
    addressBook: addressBook,
    contracts: contracts,
    actions: loadActions(contracts),
  }
}

export function connectSubgraphService(
  chainId: number,
  signerOrProvider: Signer | Provider,
  addressBookPath?: string,
): SubgraphServiceContracts {
  addressBookPath =
    addressBookPath ?? resolveAddressBook(import.meta, '@graphprotocol/address-book/subgraph-service/addresses.json')
  if (!addressBookPath) {
    throw new Error('Address book path not found')
  }
  const addressBook = new SubgraphServiceAddressBook(addressBookPath, chainId)
  return addressBook.loadContracts(signerOrProvider, false)
}
