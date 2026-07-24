import {
  CallableContractFuture,
  ContractFuture,
  ContractOptions,
  IgnitionModuleBuilder,
} from '@nomicfoundation/ignition-core'

import { ImplementationMetadata } from './implementation.js'
import { loadProxyWithABI } from './utils.js'

// Deploy a TransparentUpgradeableProxy
// The TransparentUpgradeableProxy contract creates the ProxyAdmin within its constructor.
export function deployTransparentUpgradeableProxy(
  m: IgnitionModuleBuilder,
  metadata: ImplementationMetadata,
  implementation?: ContractFuture<string>,
  options?: ContractOptions,
) {
  const deployer = m.getAccount(0)

  // The proxy requires a valid contract as initial implementation so we use a dummy
  if (implementation === undefined) {
    implementation = m.contract('Dummy', [], { ...options, id: `OZProxyDummy_${metadata.name}` })
  }

  const Proxy = m.contract('TransparentUpgradeableProxy', [implementation, deployer, '0x'], {
    ...options,
    id: `TransparentUpgradeableProxy_${metadata.name}`,
  })

  const proxyAdminAddress = m.readEventArgument(Proxy, 'AdminChanged', 'newAdmin', {
    ...options,
    id: `TransparentUpgradeableProxy_${metadata.name}_AdminChanged`,
  })

  const ProxyAdmin = m.contractAt('ProxyAdmin', proxyAdminAddress, {
    ...options,
    id: `ProxyAdmin_${metadata.name}`,
  })

  if (implementation !== undefined) {
    return { ProxyAdmin, Proxy: loadProxyWithABI(m, Proxy, metadata, options) }
  } else {
    return { ProxyAdmin, Proxy }
  }
}

export function upgradeTransparentUpgradeableProxy(
  m: IgnitionModuleBuilder,
  proxyAdmin: CallableContractFuture<string>,
  proxy: CallableContractFuture<string>,
  implementation: CallableContractFuture<string>,
  metadata: ImplementationMetadata,
  options?: ContractOptions,
) {
  const upgradeCall = m.call(
    proxyAdmin,
    'upgradeAndCall',
    [proxy, implementation, m.encodeFunctionCall(implementation, 'initialize', metadata.initArgs)],
    options,
  )
  return loadProxyWithABI(m, proxy, metadata, {
    ...options,
    id: `${metadata.name}_UpgradedProxyWithABI`,
    after: [upgradeCall],
  })
}
