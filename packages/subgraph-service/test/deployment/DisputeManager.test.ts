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

const addressBookEntry = graph.subgraphService.addressBook.getEntry('DisputeManager')
const DisputeManager = graph.subgraphService.contracts.DisputeManager

describe('DisputeManager', function () {
  testIf(2)('should be owned by the governor', async function () {
    const owner = await DisputeManager.owner()
    expect(owner).to.equal(config.$global.governor)
  })

  testIf(2)('should set the right arbitrator', async function () {
    const arbitrator = await DisputeManager.arbitrator()
    expect(arbitrator).to.equal(config.$global.arbitrator)
  })

  testIf(2)('should set the right dispute period', async function () {
    const disputePeriod = await DisputeManager.disputePeriod()
    expect(disputePeriod).to.equal(config.DisputeManager.disputePeriod)
  })

  testIf(2)('should set the right dispute deposit', async function () {
    const disputeDeposit = await DisputeManager.disputeDeposit()
    expect(disputeDeposit).to.equal(config.DisputeManager.disputeDeposit)
  })

  testIf(2)('should set the right fisherman reward cut', async function () {
    const fishermanRewardCut = await DisputeManager.fishermanRewardCut()
    expect(fishermanRewardCut).to.equal(config.DisputeManager.fishermanRewardCut)
  })

  testIf(2)('should set the right max slashing cut', async function () {
    const maxSlashingCut = await DisputeManager.maxSlashingCut()
    expect(maxSlashingCut).to.equal(config.DisputeManager.maxSlashingCut)
  })

  testIf(2)('should set the right subgraph service address', async function () {
    // Left empty in configs that rely on --patch-config to fill it at deploy time
    if (!config.$global.subgraphServiceProxyAddress) this.skip()
    const subgraphService = await DisputeManager.subgraphService()
    expect(subgraphService).to.equal(config.$global.subgraphServiceProxyAddress)
  })
})

transparentUpgradeableProxyTests(
  'DisputeManager',
  addressBookEntry,
  config.$global.governor as string,
  Number(process.env.TEST_DEPLOYMENT_STEP ?? 1) >= 2,
)
