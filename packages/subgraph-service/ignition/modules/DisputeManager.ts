import LegacyDisputeManagerArtifact from '@graphprotocol/contracts/artifacts/contracts/disputes/DisputeManager.sol/DisputeManager.json'
import { deployImplementation, upgradeTransparentUpgradeableProxy } from '@graphprotocol/horizon/ignition'
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('DisputeManager', (m) => {
  const deployer = m.getAccount(0)
  const governor = m.getParameter('governor')
  const controllerAddress = m.getParameter('controllerAddress')
  const subgraphServiceProxyAddress = m.getParameter('subgraphServiceProxyAddress')
  const disputeManagerProxyAddress = m.getParameter('disputeManagerProxyAddress')
  const disputeManagerProxyAdminAddress = m.getParameter('disputeManagerProxyAdminAddress')
  const legacyDisputeManagerAddress = m.getParameter('legacyDisputeManagerAddress')
  const arbitrator = m.getParameter('arbitrator')
  const disputePeriod = m.getParameter('disputePeriod')
  const disputeDeposit = m.getParameter('disputeDeposit')
  const fishermanRewardCut = m.getParameter('fishermanRewardCut')
  const maxSlashingCut = m.getParameter('maxSlashingCut')

  const DisputeManagerProxyAdmin = m.contractAt('ProxyAdmin', disputeManagerProxyAdminAddress)
  const DisputeManagerProxy = m.contractAt('TransparentUpgradeableProxy', disputeManagerProxyAddress, {
    id: 'DisputeManagerProxy',
  })

  // Deploy implementation
  const DisputeManagerImplementation = deployImplementation(m, {
    name: 'DisputeManager',
    constructorArgs: [controllerAddress],
  })

  // Upgrade implementation
  const DisputeManager = upgradeTransparentUpgradeableProxy(
    m,
    DisputeManagerProxyAdmin,
    DisputeManagerProxy,
    DisputeManagerImplementation,
    {
      name: 'DisputeManager',
      initArgs: [deployer, arbitrator, disputePeriod, disputeDeposit, fishermanRewardCut, maxSlashingCut],
    },
  )

  const callSetSubgraphService = m.call(DisputeManager, 'setSubgraphService', [subgraphServiceProxyAddress])

  m.call(DisputeManager, 'transferOwnership', [governor], { after: [callSetSubgraphService] })
  m.call(DisputeManagerProxyAdmin, 'transferOwnership', [governor], { after: [callSetSubgraphService] })

  const LegacyDisputeManager = m.contractAt(
    'LegacyDisputeManager',
    LegacyDisputeManagerArtifact,
    legacyDisputeManagerAddress,
  )

  return {
    DisputeManager,
    DisputeManagerImplementation,
    LegacyDisputeManager,
  }
})
