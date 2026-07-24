import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import { ethers } from 'ethers'

import { MigrateControllerGovernorModule } from '../periphery/Controller.js'
import GraphPeripheryModule from '../periphery/periphery.js'
import { deployGraphProxy } from '../proxy/GraphProxy.js'
import { deployTransparentUpgradeableProxy } from '../proxy/TransparentUpgradeableProxy.js'

// HorizonStaking, GraphPayments and PaymentsEscrow use GraphDirectory but they are also in the directory.
// So we need to deploy their proxies, register them in the controller before being able to deploy the implementations
export default buildModule('HorizonProxies', (m) => {
  const { Controller, GraphProxyAdmin } = m.useModule(GraphPeripheryModule)

  // Deploy HorizonStaking proxy with no implementation
  const HorizonStakingProxy = deployGraphProxy(m, GraphProxyAdmin)
  m.call(Controller, 'setContractProxy', [ethers.keccak256(ethers.toUtf8Bytes('Staking')), HorizonStakingProxy], {
    id: 'setContractProxy_HorizonStaking',
  })

  // Deploy and register GraphPayments proxy
  const { Proxy: GraphPaymentsProxy, ProxyAdmin: GraphPaymentsProxyAdmin } = deployTransparentUpgradeableProxy(m, {
    name: 'GraphPayments',
  })
  m.call(Controller, 'setContractProxy', [ethers.keccak256(ethers.toUtf8Bytes('GraphPayments')), GraphPaymentsProxy], {
    id: 'setContractProxy_GraphPayments',
  })

  // Deploy and register PaymentsEscrow proxy
  const { Proxy: PaymentsEscrowProxy, ProxyAdmin: PaymentsEscrowProxyAdmin } = deployTransparentUpgradeableProxy(m, {
    name: 'PaymentsEscrow',
  })
  m.call(
    Controller,
    'setContractProxy',
    [ethers.keccak256(ethers.toUtf8Bytes('PaymentsEscrow')), PaymentsEscrowProxy],
    { id: 'setContractProxy_PaymentsEscrow' },
  )

  return {
    HorizonStakingProxy,
    GraphPaymentsProxy,
    PaymentsEscrowProxy,
    GraphPaymentsProxyAdmin,
    PaymentsEscrowProxyAdmin,
  }
})

export const MigrateHorizonProxiesDeployerModule = buildModule('HorizonProxiesDeployer', (m) => {
  // Deploy GraphPayments proxy
  const { Proxy: GraphPaymentsProxy, ProxyAdmin: GraphPaymentsProxyAdmin } = deployTransparentUpgradeableProxy(m, {
    name: 'GraphPayments',
  })

  // Deploy PaymentsEscrow proxy
  const { Proxy: PaymentsEscrowProxy, ProxyAdmin: PaymentsEscrowProxyAdmin } = deployTransparentUpgradeableProxy(m, {
    name: 'PaymentsEscrow',
  })

  return { GraphPaymentsProxy, PaymentsEscrowProxy, GraphPaymentsProxyAdmin, PaymentsEscrowProxyAdmin }
})

export const MigrateHorizonProxiesGovernorModule = buildModule('HorizonProxiesGovernor', (m) => {
  const { Controller } = m.useModule(MigrateControllerGovernorModule)

  const graphPaymentsAddress = m.getParameter('graphPaymentsAddress')
  const paymentsEscrowAddress = m.getParameter('paymentsEscrowAddress')

  // Register proxies in controller
  m.call(
    Controller,
    'setContractProxy',
    [ethers.keccak256(ethers.toUtf8Bytes('GraphPayments')), graphPaymentsAddress],
    { id: 'setContractProxy_GraphPayments' },
  )

  m.call(
    Controller,
    'setContractProxy',
    [ethers.keccak256(ethers.toUtf8Bytes('PaymentsEscrow')), paymentsEscrowAddress],
    { id: 'setContractProxy_PaymentsEscrow' },
  )

  return { Controller }
})
