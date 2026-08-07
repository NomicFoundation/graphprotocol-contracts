import type { HardhatEthersProvider } from '@nomicfoundation/hardhat-ethers/types'
import type { Provider, Signer } from 'ethers'

import { resolveAddressBook } from '../../lib/resolve.js'
import { GraphIssuanceAddressBook } from './address-book.js'
import type { GraphIssuanceContracts } from './contracts.js'

export { GraphIssuanceAddressBook } from './address-book.js'
export type { GraphIssuanceContractName, GraphIssuanceContracts } from './contracts.js'
export { GraphIssuanceContractNameList } from './contracts.js'

export function loadGraphIssuance(addressBookPath: string, chainId: number, provider: HardhatEthersProvider) {
  const addressBook = new GraphIssuanceAddressBook(addressBookPath, chainId)
  const contracts = addressBook.loadContracts(provider, false)
  return {
    addressBook: addressBook,
    contracts: contracts,
  }
}

export function connectGraphIssuance(
  chainId: number,
  signerOrProvider: Signer | Provider,
  addressBookPath?: string,
): GraphIssuanceContracts {
  addressBookPath = addressBookPath ?? resolveAddressBook(import.meta, '@graphprotocol/issuance/addresses.json')
  if (!addressBookPath) {
    throw new Error('Address book path not found')
  }
  const addressBook = new GraphIssuanceAddressBook(addressBookPath, chainId)
  return addressBook.loadContracts(signerOrProvider, false)
}
