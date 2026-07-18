import type { HardhatUserConfig } from 'hardhat/config'
import { configVariable } from 'hardhat/config'
import type {
  NetworkUserConfig,
  ProjectPathsUserConfig,
  SensitiveString,
  SingleVersionSolidityUserConfig,
} from 'hardhat/types/config'

import type { ModuleResolver } from '../lib/resolve.js'
import { resolveAddressBook } from '../lib/resolve.js'

// This base config file assumes the project is using the following hardhat plugins:
// - hardhat-graph-protocol
// - hardhat-verify
// To avoid adding those dependencies on toolshed we re-declare some types here

type GraphRuntimeEnvironmentOptions = {
  deployments?: {
    [deployment in 'horizon' | 'subgraphService']?:
      | string
      | {
          addressBook: string
        }
  }
}

// Matches hardhat-verify's EtherscanUserConfig (nested under `verify.etherscan`)
interface EtherscanUserConfig {
  apiKey?: SensitiveString
  enabled?: boolean
}

// RPC URLs with defaults
const ARBITRUM_ONE_RPC = process.env.ARBITRUM_ONE_RPC || 'https://arb1.arbitrum.io/rpc'
const ARBITRUM_SEPOLIA_RPC = process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc'
const LOCAL_NETWORK_RPC = process.env.LOCAL_NETWORK_RPC || 'http://chain:8545'
const LOCALHOST_RPC = process.env.LOCALHOST_RPC || 'http://localhost:8545'

// Annotated with the single-version object variant (not the SolidityUserConfig
// union) so consumers can spread it to extend settings like npmFilesToBuild
export const solidityUserConfig: SingleVersionSolidityUserConfig = {
  version: '0.8.35',
  settings: {
    optimizer: {
      enabled: true,
      runs: 100,
    },
    viaIR: true,
    evmVersion: 'cancun',
  },
}

export const projectPathsUserConfig: ProjectPathsUserConfig = {
  artifacts: './build/contracts',
  sources: './contracts',
}

// Etherscan v2 API uses a single API key for all networks
// See: https://docs.etherscan.io/etherscan-v2/getting-started/creating-an-account
// configVariable resolves lazily from the environment or the hardhat-keystore plugin
export const etherscanUserConfig: EtherscanUserConfig = {
  apiKey: configVariable('ETHERSCAN_API_KEY'),
}

// In general:
// - "default" is used for unit tests and in-process runs (no --network flag)
// - "node" is the network served by `hardhat node`
// - "localhost" is used to connect to a locally running node or fork
// - "localNetwork" is used for testing in the local network environment
type EnhancedNetworkConfig<T> = T & {
  deployments?: {
    horizon?: string
    subgraphService?: string
  }
}

// Hardhat auto-injects the "default" and "node" networks with stock test accounts;
// defining them here overrides their accounts with the protocol mnemonic so role
// accounts (deployer, governor, ...) derive from the conventional indexes
const simulatedNetworkConfig = function (
  resolver: ModuleResolver,
  addressBookFile: string,
): EnhancedNetworkConfig<NetworkUserConfig> {
  return {
    type: 'edr-simulated',
    chainId: 31337,
    hardfork: 'cancun',
    accounts: {
      mnemonic: 'myth like bonus scare over problem client lizard pioneer submit female collect',
    },
    deployments: {
      horizon: resolveAddressBook(resolver, '@graphprotocol/horizon/addresses.json', addressBookFile),
      subgraphService: resolveAddressBook(resolver, '@graphprotocol/subgraph-service/addresses.json', addressBookFile),
    },
  }
}

type BaseNetworksUserConfig = Record<string, EnhancedNetworkConfig<NetworkUserConfig>>
export const networksUserConfig = function (resolver: ModuleResolver): BaseNetworksUserConfig {
  return {
    default: simulatedNetworkConfig(resolver, 'addresses-default.json'),
    node: simulatedNetworkConfig(resolver, 'addresses-node.json'),
    localNetwork: {
      type: 'http',
      chainId: 1337,
      url: LOCAL_NETWORK_RPC,
      deployments: {
        horizon: resolveAddressBook(resolver, '@graphprotocol/horizon/addresses.json', 'addresses-local-network.json'),
        subgraphService: resolveAddressBook(
          resolver,
          '@graphprotocol/subgraph-service/addresses.json',
          'addresses-local-network.json',
        ),
      },
    },
    localhost: {
      type: 'http',
      chainId: 31337,
      url: LOCALHOST_RPC,
      deployments: {
        horizon: resolveAddressBook(resolver, '@graphprotocol/horizon/addresses.json', 'addresses-localhost.json'),
        subgraphService: resolveAddressBook(
          resolver,
          '@graphprotocol/subgraph-service/addresses.json',
          'addresses-localhost.json',
        ),
      },
    },
    arbitrumOne: {
      type: 'http',
      chainId: 42161,
      url: ARBITRUM_ONE_RPC,
    },
    arbitrumSepolia: {
      type: 'http',
      chainId: 421614,
      url: ARBITRUM_SEPOLIA_RPC,
    },
  }
}

type BaseHardhatConfig = Omit<HardhatUserConfig, 'solidity'> & {
  solidity: SingleVersionSolidityUserConfig
  verify: { etherscan: EtherscanUserConfig }
  graph: GraphRuntimeEnvironmentOptions
}
export const hardhatBaseConfig = function (resolver: ModuleResolver): BaseHardhatConfig {
  return {
    solidity: solidityUserConfig,
    paths: projectPathsUserConfig,
    networks: networksUserConfig(resolver),
    graph: {
      deployments: {
        horizon: resolveAddressBook(resolver, '@graphprotocol/horizon/addresses.json'),
        subgraphService: resolveAddressBook(resolver, '@graphprotocol/subgraph-service/addresses.json'),
      },
    },
    verify: {
      etherscan: etherscanUserConfig,
    },
  }
}

export default hardhatBaseConfig
