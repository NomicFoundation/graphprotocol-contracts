import { printBanner } from '@graphprotocol/toolshed/utils'
import { glob } from 'glob'
import { task } from 'hardhat/config'
import { ArgumentType } from 'hardhat/types/arguments'
import type { NewTaskActionFunction } from 'hardhat/types/tasks'

interface IntegrationArgs {
  phase?: string
}

const integrationAction: NewTaskActionFunction<IntegrationArgs> = async (taskArgs, hre) => {
  // Get test files for each phase
  const afterTransitionPeriodFiles = await glob('test/integration/after-transition-period/**/*.{js,ts}')

  // Display banner for the current test phase
  printBanner(taskArgs.phase ?? '', 'INTEGRATION TESTS: ')

  const mocha = hre.tasks.getTask(['test', 'mocha'])
  switch (taskArgs.phase) {
    case 'after-transition-period':
      await mocha.run({ testFiles: afterTransitionPeriodFiles })
      break
    default:
      throw new Error('Invalid phase. Must be "after-transition-period"')
  }
}

const integrationTask = task('test:integration', 'Runs all integration tests')
  .addOption({
    name: 'phase',
    description: 'Test phase to run: "after-transition-period"',
    type: ArgumentType.STRING_WITHOUT_DEFAULT,
    defaultValue: undefined,
  })
  .setAction(async () => ({ default: integrationAction }))
  .build()

export default integrationTask
