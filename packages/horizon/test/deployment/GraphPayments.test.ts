import { loadConfig } from '@graphprotocol/toolshed/hardhat'
import { expect } from 'chai'

import { connection } from './lib/connection.js'
import { testIf } from './lib/testIf.js'
import { transparentUpgradeableProxyTests } from './lib/TransparentUpgradeableProxy.tests.js'

const config = loadConfig(
  './ignition/configs/',
  'migrate',
  String(process.env.TEST_DEPLOYMENT_CONFIG ?? connection.networkName),
).config
const graph = await connection.graph()

const addressBookEntry = graph.horizon.addressBook.getEntry('GraphPayments')
const GraphPayments = graph.horizon.contracts.GraphPayments

describe('GraphPayments', function () {
  testIf(3)('should set the right protocolPaymentCut', async function () {
    const protocolPaymentCut = await GraphPayments.PROTOCOL_PAYMENT_CUT()
    expect(protocolPaymentCut).to.equal(config.GraphPayments.protocolPaymentCut)
  })
})

transparentUpgradeableProxyTests(
  'GraphPayments',
  addressBookEntry,
  config.$global.governor as string,
  Number(process.env.TEST_DEPLOYMENT_STEP ?? 1) >= 3,
)
