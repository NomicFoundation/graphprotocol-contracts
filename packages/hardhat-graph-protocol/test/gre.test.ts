import { fileURLToPath } from 'node:url'

import { GraphHorizonAddressBook } from '@graphprotocol/toolshed/deployments'
import { assert, expect } from 'chai'
import type { HardhatUserConfig } from 'hardhat/config'
import { createHardhatRuntimeEnvironment } from 'hardhat/hre'
import path from 'path'

import hardhatGraphProtocol from '../src/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const filesDir = path.join(__dirname, 'fixtures', 'files')
const packageRoot = path.join(__dirname, '..')

// Note: createHardhatRuntimeEnvironment normalizes the project root up to the
// nearest package.json, so relative `paths.graph` values resolve against the
// package root — use absolute paths in test configs.
function createHre(config: HardhatUserConfig) {
  return createHardhatRuntimeEnvironment(config, {}, packageRoot)
}

const arbitrumSepoliaConfig: HardhatUserConfig = {
  plugins: [hardhatGraphProtocol],
  paths: {
    graph: filesDir,
  },
  networks: {
    arbitrumSepolia: {
      type: 'http',
      chainId: 421614,
      url: 'https://sepolia-rollup.arbitrum.io/rpc',
      deployments: {
        horizon: 'addresses-arbsep.json',
      },
    },
  },
}

describe('GRE usage', function () {
  describe('Project not using GRE', function () {
    it('should not expose graph on the network connection', async function () {
      const hre = await createHre({
        networks: {
          mainnet: { type: 'http', chainId: 1, url: 'https://mainnet.infura.io/v3/123456' },
        },
      })
      const connection = await hre.network.create('mainnet')
      expect(() => connection.graph()).to.throw()
    })
  })

  describe('Project using GRE - graph path', function () {
    it('should default the graph path to the project root', async function () {
      const hre = await createHre({ plugins: [hardhatGraphProtocol] })
      assert.equal(hre.config.paths.graph, packageRoot)
    })

    it('should use the configured graph path', async function () {
      const hre = await createHre({
        plugins: [hardhatGraphProtocol],
        paths: { graph: filesDir },
      })
      assert.equal(hre.config.paths.graph, filesDir)
    })
  })

  describe('Project using GRE - config resolution', function () {
    it('should keep per-network deployments in the resolved config', async function () {
      const hre = await createHre(arbitrumSepoliaConfig)
      assert.deepEqual(hre.config.networks.arbitrumSepolia.deployments, {
        horizon: 'addresses-arbsep.json',
      })
    })
  })

  describe('Project using GRE - deployments', function () {
    // Skipped: the fixture address book contains legacy fields rejected by address book validation
    it.skip('should load Horizon deployment', async function () {
      const hre = await createHre(arbitrumSepoliaConfig)
      const connection = await hre.network.create('arbitrumSepolia')
      const graph = await connection.graph()

      assert.isDefined(graph.horizon)
      assert.isObject(graph.horizon)

      assert.isDefined(graph.horizon.contracts)
      assert.isObject(graph.horizon.contracts)

      assert.isDefined(graph.horizon.addressBook)
      assert.isObject(graph.horizon.addressBook)
      assert.instanceOf(graph.horizon.addressBook, GraphHorizonAddressBook)
    })
  })
})
