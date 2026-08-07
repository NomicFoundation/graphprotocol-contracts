import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

import CurationModule from '../Curation.js'
import DisputeManagerModule from '../DisputeManager.js'
import GNSModule from '../GNS.js'
import ServiceRegistryModule from '../ServiceRegistry.js'
import SubgraphServiceModule from '../SubgraphService.js'

export default buildModule('SubgraphService_Migrate_2', (m) => {
  const { DisputeManager, DisputeManagerImplementation, LegacyDisputeManager } = m.useModule(DisputeManagerModule)
  const { SubgraphService, SubgraphServiceImplementation } = m.useModule(SubgraphServiceModule)
  const { L2Curation, L2CurationImplementation } = m.useModule(CurationModule)
  const { L2GNS, L2GNSImplementation, SubgraphNFT } = m.useModule(GNSModule)
  const { LegacyServiceRegistry } = m.useModule(ServiceRegistryModule)

  return {
    Transparent_Proxy_DisputeManager: DisputeManager,
    Implementation_DisputeManager: DisputeManagerImplementation,
    Transparent_Proxy_SubgraphService: SubgraphService,
    Implementation_SubgraphService: SubgraphServiceImplementation,
    Graph_Proxy_L2Curation: L2Curation,
    Implementation_L2Curation: L2CurationImplementation,
    Graph_Proxy_L2GNS: L2GNS,
    Implementation_L2GNS: L2GNSImplementation,
    SubgraphNFT,
    LegacyDisputeManager,
    LegacyServiceRegistry,
  }
})
