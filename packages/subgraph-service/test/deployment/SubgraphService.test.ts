import { loadConfig } from '@graphprotocol/toolshed/hardhat'
import { expect } from 'chai'

import { connection } from '../../../horizon/test/deployment/lib/connection.js'
import { testIf } from '../../../horizon/test/deployment/lib/testIf.js'
import { transparentUpgradeableProxyTests } from '../../../horizon/test/deployment/lib/TransparentUpgradeableProxy.tests.js'

const config = loadConfig(
  './ignition/configs/',
  'migrate',
  String(process.env.TEST_DEPLOYMENT_CONFIG ?? connection.networkName),
).config
const graph = await connection.graph()

const addressBookEntry = graph.subgraphService.addressBook.getEntry('SubgraphService')
const SubgraphService = graph.subgraphService.contracts.SubgraphService

describe('SubgraphService', function () {
  testIf(2)('should be owned by the governor', async function () {
    const owner = await SubgraphService.owner()
    expect(owner).to.equal(config.$global.governor)
  })

  testIf(2)('should set the right minimum provision tokens', async function () {
    const [minimumProvisionTokens] = await SubgraphService.getProvisionTokensRange()
    expect(minimumProvisionTokens).to.equal(config.SubgraphService.minimumProvisionTokens)
  })

  testIf(2)('should set the right delegation ratio', async function () {
    const delegationRatio = await SubgraphService.getDelegationRatio()
    expect(delegationRatio).to.equal(config.SubgraphService.maximumDelegationRatio)
  })

  testIf(2)('should set the right stake to fees ratio', async function () {
    const stakeToFeesRatio = await SubgraphService.stakeToFeesRatio()
    expect(stakeToFeesRatio).to.equal(config.SubgraphService.stakeToFeesRatio)
  })

  testIf(2)('should set the right dispute manager address', async function () {
    // Left empty in configs that rely on --patch-config to fill it at deploy time
    if (!config.$global.disputeManagerProxyAddress) this.skip()
    const disputeManagerAddress = await SubgraphService.getDisputeManager()
    expect(disputeManagerAddress).to.equal(config.$global.disputeManagerProxyAddress)
  })

  testIf(2)('should set the right graph tally address', async function () {
    // Left empty in configs that rely on --patch-config to fill it at deploy time
    if (!config.$global.graphTallyCollectorAddress) this.skip()
    const graphTallyAddress = await SubgraphService.getGraphTallyCollector()
    expect(graphTallyAddress).to.equal(config.$global.graphTallyCollectorAddress)
  })

  testIf(2)('should set the right curation address', async function () {
    const curationAddress = await SubgraphService.getCuration()
    expect(curationAddress).to.equal(config.$global.curationProxyAddress)
  })

  testIf(2)('should set the right pause guardians', async function () {
    expect(await SubgraphService.pauseGuardians(config.$global.pauseGuardian as string)).to.equal(true)
    expect(await SubgraphService.pauseGuardians(config.$global.governor as string)).to.equal(true)
  })

  testIf(2)('should set the right maxPOIStaleness', async function () {
    const maxPOIStaleness = await SubgraphService.maxPOIStaleness()
    expect(maxPOIStaleness).to.equal(config.SubgraphService.maxPOIStaleness)
  })

  testIf(2)('should set the right curationCut', async function () {
    const curationCut = await SubgraphService.curationFeesCut()
    expect(curationCut).to.equal(config.SubgraphService.curationCut)
  })
})

transparentUpgradeableProxyTests(
  'SubgraphService',
  addressBookEntry,
  config.$global.governor as string,
  Number(process.env.TEST_DEPLOYMENT_STEP ?? 1) >= 2,
)
