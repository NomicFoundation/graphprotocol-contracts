import { requireLocalNetwork } from '@graphprotocol/toolshed/hardhat'
import { printBanner } from '@graphprotocol/toolshed/utils'
import { task } from 'hardhat/config'
import { ArgumentType } from 'hardhat/types/arguments'
import type { NewTaskActionFunction } from 'hardhat/types/tasks'

interface EnableDelegationSlashingArgs {
  governorIndex: number
  skipNetworkCheck: boolean
}

const enableDelegationSlashingAction: NewTaskActionFunction<EnableDelegationSlashingArgs> = async (taskArgs, hre) => {
  printBanner('ENABLING DELEGATION SLASHING')

  const connection = await hre.network.create()

  if (!taskArgs.skipNetworkCheck) {
    requireLocalNetwork(connection.networkName)
  }

  const graph = await connection.graph()
  const governor = await graph.accounts.getGovernor(taskArgs.governorIndex)
  const horizonStaking = graph.horizon.contracts.HorizonStaking

  console.log('Enabling delegation slashing...')
  await horizonStaking.connect(governor).setDelegationSlashingEnabled()

  // Log if the delegation slashing is enabled
  const delegationSlashingEnabled = await horizonStaking.isDelegationSlashingEnabled()
  console.log('Delegation slashing enabled:', delegationSlashingEnabled)
}

const enableDelegationSlashingTask = task(
  'transition:enable-delegation-slashing',
  'Enables delegation slashing in HorizonStaking',
)
  .addOption({
    name: 'governorIndex',
    description: 'Derivation path index for the governor account',
    type: ArgumentType.INT,
    defaultValue: 1,
  })
  .addFlag({
    name: 'skipNetworkCheck',
    description: 'Skip the network check (use with caution)',
  })
  .setAction(async () => ({ default: enableDelegationSlashingAction }))
  .build()

export default enableDelegationSlashingTask
