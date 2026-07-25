import { loadConfig } from '@graphprotocol/toolshed/hardhat'
import { expect } from 'chai'

import { connection } from './lib/connection.js'
import { graphProxyTests } from './lib/GraphProxy.test.js'
import { testIf } from './lib/testIf.js'

const config = loadConfig(
  './ignition/configs/',
  'migrate',
  String(process.env.TEST_DEPLOYMENT_CONFIG ?? connection.networkName),
).config
const graph = await connection.graph()

const graphProxyAdminAddressBookEntry = graph.horizon.addressBook.getEntry('GraphProxyAdmin')
const curationAddressBookEntry = graph.horizon.addressBook.getEntry('L2Curation')
const Curation = graph.horizon.contracts.L2Curation

describe('Curation', function () {
  testIf(4)('should set the right subgraph service', async function () {
    const subgraphService = await Curation.subgraphService()
    expect(subgraphService).to.equal(config.$global.subgraphServiceAddress)
  })
})

graphProxyTests('Curation', curationAddressBookEntry, graphProxyAdminAddressBookEntry.address)
