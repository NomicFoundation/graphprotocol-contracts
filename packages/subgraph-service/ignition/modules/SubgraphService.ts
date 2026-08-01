import { deployImplementation, upgradeTransparentUpgradeableProxy } from '@graphprotocol/horizon/ignition'
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('SubgraphService', (m) => {
  const deployer = m.getAccount(0)
  const governor = m.getParameter('governor')
  const pauseGuardian = m.getParameter('pauseGuardian')
  const controllerAddress = m.getParameter('controllerAddress')
  const subgraphServiceProxyAddress = m.getParameter('subgraphServiceProxyAddress')
  const subgraphServiceProxyAdminAddress = m.getParameter('subgraphServiceProxyAdminAddress')
  const disputeManagerProxyAddress = m.getParameter('disputeManagerProxyAddress')
  const graphTallyCollectorAddress = m.getParameter('graphTallyCollectorAddress')
  const curationProxyAddress = m.getParameter('curationProxyAddress')
  const recurringCollectorAddress = m.getParameter('recurringCollectorAddress')
  const minimumProvisionTokens = m.getParameter('minimumProvisionTokens')
  const maximumDelegationRatio = m.getParameter('maximumDelegationRatio')
  const stakeToFeesRatio = m.getParameter('stakeToFeesRatio')
  const maxPOIStaleness = m.getParameter('maxPOIStaleness')
  const curationCut = m.getParameter('curationCut')

  const SubgraphServiceProxyAdmin = m.contractAt('ProxyAdmin', subgraphServiceProxyAdminAddress)
  const SubgraphServiceProxy = m.contractAt('TransparentUpgradeableProxy', subgraphServiceProxyAddress, {
    id: 'SubgraphServiceProxy',
  })

  // Deploy libraries required by SubgraphService
  const StakeClaims = m.library('StakeClaims')
  const AllocationHandler = m.library('AllocationHandler')
  const IndexingAgreementDecoderRaw = m.library('IndexingAgreementDecoderRaw')
  const IndexingAgreementDecoder = m.library('IndexingAgreementDecoder', {
    libraries: { IndexingAgreementDecoderRaw },
  })
  const IndexingAgreement = m.library('IndexingAgreement', {
    libraries: { IndexingAgreementDecoder },
  })

  // Deploy implementation
  const SubgraphServiceImplementation = deployImplementation(
    m,
    {
      name: 'SubgraphService',
      constructorArgs: [
        controllerAddress,
        disputeManagerProxyAddress,
        graphTallyCollectorAddress,
        curationProxyAddress,
        recurringCollectorAddress,
      ],
    },
    {
      libraries: {
        StakeClaims,
        AllocationHandler,
        IndexingAgreement,
        IndexingAgreementDecoder,
      },
    },
  )

  // Upgrade implementation
  const SubgraphService = upgradeTransparentUpgradeableProxy(
    m,
    SubgraphServiceProxyAdmin,
    SubgraphServiceProxy,
    SubgraphServiceImplementation,
    {
      name: 'SubgraphService',
      initArgs: [deployer, minimumProvisionTokens, maximumDelegationRatio, stakeToFeesRatio],
    },
  )

  const callSetPauseGuardianGovernor = m.call(SubgraphService, 'setPauseGuardian', [governor, true], {
    id: 'setPauseGuardianGovernor',
  })
  const callSetPauseGuardianPauseGuardian = m.call(SubgraphService, 'setPauseGuardian', [pauseGuardian, true], {
    id: 'setPauseGuardianPauseGuardian',
  })
  const callSetMaxPOIStaleness = m.call(SubgraphService, 'setMaxPOIStaleness', [maxPOIStaleness])
  const callSetCurationCut = m.call(SubgraphService, 'setCurationCut', [curationCut])

  m.call(SubgraphService, 'transferOwnership', [governor], {
    after: [
      callSetPauseGuardianGovernor,
      callSetPauseGuardianPauseGuardian,
      callSetMaxPOIStaleness,
      callSetCurationCut,
    ],
  })
  m.call(SubgraphServiceProxyAdmin, 'transferOwnership', [governor], {
    after: [
      callSetPauseGuardianGovernor,
      callSetPauseGuardianPauseGuardian,
      callSetMaxPOIStaleness,
      callSetCurationCut,
    ],
  })

  return {
    SubgraphService,
    SubgraphServiceImplementation,
  }
})
