import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

import { MigrateHorizonStakingGovernorModule } from '../core/HorizonStaking.js'
import { MigrateCurationGovernorModule } from '../periphery/Curation.js'
import { MigrateRewardsManagerGovernorModule } from '../periphery/RewardsManager.js'

// Registering the dispute manager on the controller lives in a separate module
// (migrate-4-dispute-manager.ts): it requires a non-zero address, which only
// exists when the subgraph service is deployed, and ignition modules cannot
// branch on parameter values. The deploy:migrate task runs it after this module
// unless --standalone is passed.
export default buildModule('GraphHorizon_Migrate_4', (m) => {
  m.useModule(MigrateCurationGovernorModule)
  m.useModule(MigrateRewardsManagerGovernorModule)
  m.useModule(MigrateHorizonStakingGovernorModule)

  return {}
})
