import type { GraphDeploymentName } from '@graphprotocol/toolshed/deployments'
import fs from 'fs'
import path from 'path'

import { GraphPluginError } from './error.js'
import { logDebug } from './logger.js'
import type { GraphDeploymentOptions, GraphRuntimeEnvironmentOptions } from './types.js'

export interface AddressBookResolutionContext {
  networkConfig: { deployments?: GraphDeploymentOptions } | undefined
  graphConfig: GraphRuntimeEnvironmentOptions | undefined
  graphPath: string
}

export function getAddressBookPath(
  deployment: GraphDeploymentName,
  ctx: AddressBookResolutionContext,
  opts: GraphRuntimeEnvironmentOptions,
): string | undefined {
  const optsPath = getPath(opts.deployments?.[deployment])
  const networkPath = getPath(ctx.networkConfig?.deployments?.[deployment])
  const globalPath = getPath(ctx.graphConfig?.deployments?.[deployment])

  logDebug(`Getting address book path...`)
  logDebug(`Graph base dir: ${ctx.graphPath}`)
  logDebug(`1) opts: ${optsPath}`)
  logDebug(`2) network: ${networkPath}`)
  logDebug(`3) global: ${globalPath}`)

  const addressBookPath = optsPath ?? networkPath ?? globalPath
  if (addressBookPath === undefined) {
    return undefined
  }

  const normalizedAddressBookPath = normalizePath(addressBookPath, ctx.graphPath)
  logDebug(`Address book path: ${normalizedAddressBookPath}`)

  if (!fs.existsSync(normalizedAddressBookPath)) {
    if (opts.createAddressBook) {
      logDebug(`Creating address book: ${normalizedAddressBookPath}`)
      fs.writeFileSync(normalizedAddressBookPath, '{}\n')
    } else {
      throw new GraphPluginError(`Address book not found: ${normalizedAddressBookPath}`)
    }
  }

  return normalizedAddressBookPath
}

function normalizePath(_path: string, graphPath?: string): string {
  if (!path.isAbsolute(_path) && graphPath !== undefined) {
    _path = path.join(graphPath, _path)
  }
  return _path
}

function getPath(
  value:
    | string
    | {
        addressBook: string
      }
    | undefined,
): string | undefined {
  if (typeof value === 'string') {
    return value
  } else if (value && typeof value == 'object') {
    return value.addressBook
  }
  return
}
