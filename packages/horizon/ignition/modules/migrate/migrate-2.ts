import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

import { MigrateHorizonProxiesGovernorModule } from '../core/HorizonProxies.js'

export default buildModule('GraphHorizon_Migrate_2', (m) => {
  const { Controller } = m.useModule(MigrateHorizonProxiesGovernorModule)

  return { Controller }
})
