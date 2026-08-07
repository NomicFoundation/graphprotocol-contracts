import {
  ContractAtFuture,
  ContractFuture,
  ContractOptions,
  IgnitionModuleBuilder,
} from '@nomicfoundation/ignition-core'

import type { ImplementationMetadata } from './implementation.js'

export function loadProxyWithABI(
  m: IgnitionModuleBuilder,
  proxy: ContractFuture<string> | ContractAtFuture,
  contract: ImplementationMetadata,
  options?: ContractOptions,
) {
  const { id: customId, ...rest } = options ?? {}
  let proxyWithABI
  if (contract.artifact === undefined) {
    // Resolve the ABI by contract name; the id keeps the artifact-based naming so
    // future ids stay stable across existing ignition deployments
    proxyWithABI = m.contractAt(contract.name, proxy, { ...rest, id: customId ?? `${contract.name}_ProxyWithABI` })
  } else {
    proxyWithABI = m.contractAt(customId ?? `${contract.name}_ProxyWithABI`, contract.artifact, proxy, rest)
  }
  return proxyWithABI
}
