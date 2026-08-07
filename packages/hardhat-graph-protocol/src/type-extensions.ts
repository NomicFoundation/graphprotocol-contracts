// To extend one of Hardhat's types, you need to import the module where it has been defined, and redeclare it.
import 'hardhat/types/config'
import 'hardhat/types/network'

import type { GraphDeploymentOptions, GraphRuntimeEnvironment, GraphRuntimeEnvironmentOptions } from './types.js'

declare module 'hardhat/types/network' {
  interface NetworkConnection {
    graph: (opts?: GraphRuntimeEnvironmentOptions) => Promise<GraphRuntimeEnvironment>
  }
}

declare module 'hardhat/types/config' {
  interface HardhatConfig {
    graph?: GraphRuntimeEnvironmentOptions
  }

  interface HardhatUserConfig {
    graph?: GraphRuntimeEnvironmentOptions
  }

  interface EdrNetworkConfig {
    deployments?: GraphDeploymentOptions
  }

  interface EdrNetworkUserConfig {
    deployments?: GraphDeploymentOptions
  }

  interface HttpNetworkConfig {
    deployments?: GraphDeploymentOptions
  }

  interface HttpNetworkUserConfig {
    deployments?: GraphDeploymentOptions
  }

  interface ProjectPathsConfig {
    graph: string
  }

  interface ProjectPathsUserConfig {
    graph?: string
  }
}
