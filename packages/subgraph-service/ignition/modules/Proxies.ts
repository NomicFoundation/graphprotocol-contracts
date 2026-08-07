import { deployTransparentUpgradeableProxy } from '@graphprotocol/horizon/ignition'
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('SubgraphServiceProxies', (m) => {
  // Deploy proxies contracts using OZ TransparentUpgradeableProxy
  const { Proxy: DisputeManagerProxy, ProxyAdmin: DisputeManagerProxyAdmin } = deployTransparentUpgradeableProxy(m, {
    name: 'DisputeManager',
  })
  const { Proxy: SubgraphServiceProxy, ProxyAdmin: SubgraphServiceProxyAdmin } = deployTransparentUpgradeableProxy(m, {
    name: 'SubgraphService',
  })

  return {
    SubgraphServiceProxy,
    SubgraphServiceProxyAdmin,
    DisputeManagerProxy,
    DisputeManagerProxyAdmin,
  }
})
