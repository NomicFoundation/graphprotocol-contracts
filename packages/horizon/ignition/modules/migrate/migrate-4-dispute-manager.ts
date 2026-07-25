import ControllerArtifact from '@graphprotocol/contracts/artifacts/contracts/governance/Controller.sol/Controller.json'
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import { ethers } from 'ethers'

// Patch controller to override old dispute manager address. Run as part of
// migration step 4, but only when the subgraph service is deployed: the
// controller rejects the zero address.
export default buildModule('GraphHorizon_Migrate_4_DisputeManager', (m) => {
  const disputeManagerAddress = m.getParameter('disputeManagerAddress')
  const controllerAddress = m.getParameter('controllerAddress')
  const Controller = m.contractAt('Controller', ControllerArtifact, controllerAddress)
  m.call(
    Controller,
    'setContractProxy',
    [ethers.keccak256(ethers.toUtf8Bytes('DisputeManager')), disputeManagerAddress],
    {
      id: 'setContractProxy_DisputeManager',
    },
  )

  return {}
})
