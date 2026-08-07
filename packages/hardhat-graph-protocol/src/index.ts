import './type-extensions.js'

import { definePlugin } from 'hardhat/plugins'

const hardhatGraphProtocolPlugin = definePlugin({
  id: 'hardhat-graph-protocol',
  hookHandlers: {
    config: () => import('./hook-handlers/config.js'),
    network: () => import('./hook-handlers/network.js'),
  },
  dependencies: () => [import('@nomicfoundation/hardhat-ethers')],
  npmPackage: 'hardhat-graph-protocol',
})

export default hardhatGraphProtocolPlugin

export type { GraphDeploymentOptions, GraphRuntimeEnvironment, GraphRuntimeEnvironmentOptions } from './types.js'
