import type { HardhatEthersProvider } from '@nomicfoundation/hardhat-ethers/types'
import type { Provider, Signer } from 'ethers'

import { resolveAddressBook } from '../../lib/resolve.js'
import { loadActions } from './actions.js'
import { GraphHorizonAddressBook } from './address-book.js'
import type { GraphHorizonContracts } from './contracts.js'

export { GraphHorizonAddressBook } from './address-book.js'
export type { GraphHorizonContractName, GraphHorizonContracts } from './contracts.js'
export { GraphHorizonContractNameList } from './contracts.js'

export function loadGraphHorizon(addressBookPath: string, chainId: number, provider: HardhatEthersProvider) {
  const addressBook = new GraphHorizonAddressBook(addressBookPath, chainId)
  const contracts = addressBook.loadContracts(provider, false)
  return {
    addressBook: addressBook,
    contracts: contracts,
    actions: loadActions(contracts),
  }
}

export function connectGraphHorizon(
  chainId: number,
  signerOrProvider: Signer | Provider,
  addressBookPath?: string,
): GraphHorizonContracts {
  addressBookPath =
    addressBookPath ?? resolveAddressBook(import.meta, '@graphprotocol/address-book/horizon/addresses.json')
  if (!addressBookPath) {
    throw new Error('Address book path not found')
  }
  const addressBook = new GraphHorizonAddressBook(addressBookPath, chainId)
  return addressBook.loadContracts(signerOrProvider, false)
}
