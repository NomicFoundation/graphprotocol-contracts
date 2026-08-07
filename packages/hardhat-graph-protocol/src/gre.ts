import type { GraphDeployments } from '@graphprotocol/toolshed/deployments'
import { loadGraphHorizon, loadSubgraphService } from '@graphprotocol/toolshed/deployments'
import type { HardhatConfig } from 'hardhat/types/config'
import type { ChainType, NetworkConnection } from 'hardhat/types/network'

import { getAccounts } from './accounts.js'
import { getAddressBookPath } from './config.js'
import { GraphPluginError } from './error.js'
import { logDebug, logError } from './logger.js'
import type { GraphRuntimeEnvironment, GraphRuntimeEnvironmentOptions } from './types.js'
import { isGraphDeployment } from './types.js'

export async function loadGraphRuntimeEnvironment<ChainTypeT extends ChainType | string>(
  connection: NetworkConnection<ChainTypeT>,
  config: Pick<HardhatConfig, 'paths' | 'graph'>,
  opts?: GraphRuntimeEnvironmentOptions,
): Promise<GraphRuntimeEnvironment> {
  const {
    networkName,
    networkConfig,
    ethers: { provider },
  } = connection

  logDebug('*** Initializing Graph Runtime Environment (GRE) ***')
  logDebug(`Main network: ${networkName}`)

  const resolvedOpts: GraphRuntimeEnvironmentOptions = opts ?? {
    deployments: {},
    createAddressBook: false,
  }

  const chainId = networkConfig.chainId
  if (chainId === undefined) {
    throw new GraphPluginError('Please define chainId in your Hardhat network configuration')
  }
  logDebug(`Chain Id: ${chainId}`)

  const deployments = [
    ...new Set(
      [
        ...Object.keys(resolvedOpts.deployments ?? {}),
        ...Object.keys(networkConfig.deployments ?? {}),
        ...Object.keys(config.graph?.deployments ?? {}),
      ].filter((value) => isGraphDeployment(value)),
    ),
  ]
  logDebug(`Detected deployments: ${deployments.join(', ')}`)

  // Build the Graph Runtime Environment (GRE) for each deployment
  const greDeployments = {} as GraphDeployments

  const resolutionCtx = {
    networkConfig,
    graphConfig: config.graph,
    graphPath: config.paths.graph,
  }

  for (const deployment of deployments) {
    logDebug(`== Initializing deployment: ${deployment} ==`)

    // A deployment can be configured but not available on the network - most
    // commonly the address book file does not exist. Skip it instead of failing
    // the whole environment so the other deployments remain usable.
    let addressBookPath: string | undefined
    try {
      addressBookPath = getAddressBookPath(deployment, resolutionCtx, resolvedOpts)
    } catch (error) {
      logError(`Skipping deployment ${deployment} - Reason: ${error instanceof Error ? error.message : error}`)
      continue
    }
    if (addressBookPath === undefined) {
      logError(`Skipping deployment ${deployment} - Reason: address book path does not exist`)
      continue
    }

    try {
      switch (deployment) {
        case 'horizon':
          greDeployments.horizon = loadGraphHorizon(addressBookPath, chainId, provider)
          break
        case 'subgraphService':
          greDeployments.subgraphService = loadSubgraphService(addressBookPath, chainId, provider)
          break
        default:
          logError(`Skipping deployment ${deployment} - Reason: unknown deployment`)
          break
      }
    } catch (error) {
      logError(`Skipping deployment ${deployment} - Reason: runtime error`)
      logError(error)
      continue
    }
  }

  // Accounts
  // We use ? here because we've previously asserted that the deployment exists which might not be true
  const accounts = getAccounts(provider, chainId, greDeployments.horizon?.contracts?.GraphToken?.target)

  logDebug('GRE initialized successfully!')

  return {
    ...greDeployments,
    provider,
    chainId,
    accounts,
  }
}
