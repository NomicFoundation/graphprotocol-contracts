import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

import GraphPeripheryModule from '../periphery/periphery.js'
import { deployImplementation } from '../proxy/implementation.js'
import {
  deployTransparentUpgradeableProxy,
  upgradeTransparentUpgradeableProxy,
} from '../proxy/TransparentUpgradeableProxy.js'
import HorizonProxiesModule from './HorizonProxies.js'

export default buildModule('RecurringCollector', (m) => {
  const { Controller } = m.useModule(GraphPeripheryModule)

  const governor = m.getParameter('governor')
  const revokeSignerThawingPeriod = m.getParameter('revokeSignerThawingPeriod')
  const eip712Name = m.getParameter('eip712Name')
  const eip712Version = m.getParameter('eip712Version')

  // Deploy RecurringCollector proxy
  const { Proxy: RecurringCollectorProxy, ProxyAdmin: RecurringCollectorProxyAdmin } =
    deployTransparentUpgradeableProxy(m, {
      name: 'RecurringCollector',
    })

  // Deploy RecurringCollector implementation
  const RecurringCollectorImplementation = deployImplementation(
    m,
    {
      name: 'RecurringCollector',
      constructorArgs: [Controller, revokeSignerThawingPeriod],
    },
    { after: [GraphPeripheryModule, HorizonProxiesModule] },
  )

  // Upgrade proxy to implementation contract
  const RecurringCollector = upgradeTransparentUpgradeableProxy(
    m,
    RecurringCollectorProxyAdmin,
    RecurringCollectorProxy,
    RecurringCollectorImplementation,
    {
      name: 'RecurringCollector',
      initArgs: [eip712Name, eip712Version],
    },
  )

  m.call(RecurringCollectorProxyAdmin, 'transferOwnership', [governor], { after: [RecurringCollector] })

  return { RecurringCollector, RecurringCollectorProxyAdmin, RecurringCollectorImplementation }
})
