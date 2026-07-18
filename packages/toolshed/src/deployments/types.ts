import type { loadActions } from './horizon/actions.js'
import type { GraphHorizonAddressBook, GraphHorizonContracts } from './horizon/index.js'
import type { loadActions as loadSubgraphServiceActions } from './subgraph-service/actions.js'
import type { SubgraphServiceAddressBook, SubgraphServiceContracts } from './subgraph-service/index.js'
export const GraphDeploymentsList = ['horizon', 'subgraphService'] as const

export type GraphDeploymentName = (typeof GraphDeploymentsList)[number]

export type GraphDeployments = {
  horizon: {
    contracts: GraphHorizonContracts
    addressBook: GraphHorizonAddressBook
    actions: ReturnType<typeof loadActions>
  }
  subgraphService: {
    contracts: SubgraphServiceContracts
    addressBook: SubgraphServiceAddressBook
    actions: ReturnType<typeof loadSubgraphServiceActions>
  }
}
