import type { NetworkHooks } from 'hardhat/types/hooks'

import { loadGraphRuntimeEnvironment } from '../gre.js'
import type { GraphRuntimeEnvironment, GraphRuntimeEnvironmentOptions } from '../types.js'

export default async (): Promise<Partial<NetworkHooks>> => ({
  async newConnection(context, next) {
    const connection = await next(context)

    // Lazy accessor: the GRE is only built (and the address books read) when
    // first called, and the result is cached for the connection's lifetime.
    // Options are honored on the first call only.
    let gre: Promise<GraphRuntimeEnvironment> | undefined
    connection.graph = (opts?: GraphRuntimeEnvironmentOptions) => {
      gre ??= loadGraphRuntimeEnvironment(connection, context.config, opts)
      return gre
    }

    return connection
  },
})
