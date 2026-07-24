/* eslint-disable no-case-declarations */
import { ZERO_ADDRESS } from '@graphprotocol/toolshed'
import type { AddressBook } from '@graphprotocol/toolshed/deployments'
import { loadConfig, patchConfig, saveToAddressBook } from '@graphprotocol/toolshed/hardhat'
import { printHorizonBanner } from '@graphprotocol/toolshed/utils'
import { task } from 'hardhat/config'
import { ArgumentType } from 'hardhat/types/arguments'
import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre'
import type { NewTaskActionFunction } from 'hardhat/types/tasks'

interface DeployProtocolArgs {
  horizonConfig?: string
  accountIndex: number
}

interface DeployMigrateArgs {
  horizonConfig?: string
  step: number
  accountIndex: number
  patchConfig: boolean
  standalone: boolean
  hideBanner: boolean
}

// Deployed bytecode must come from the production build profile - the default
// profile skips viaIR and the optimizer for fast iteration
async function buildProductionArtifacts(hre: HardhatRuntimeEnvironment) {
  await hre.tasks.getTask('build').run({ defaultBuildProfile: 'production', noTests: true, quiet: true })
}

const deployProtocolAction: NewTaskActionFunction<DeployProtocolArgs> = async (args, hre) => {
  await buildProductionArtifacts(hre)

  const connection = await hre.network.create()
  const { ethers, ignition } = connection
  const graph = await connection.graph({ createAddressBook: true })

  // Load configuration for the deployment
  console.log('\n========== ⚙️ Deployment configuration ==========')
  const { config: HorizonConfig, file } = loadConfig(
    './ignition/configs/',
    'protocol',
    args.horizonConfig ?? connection.networkName,
  )
  console.log(`Loaded migration configuration from ${file}`)

  // Display the deployer
  console.log('\n========== 🔑 Deployer account ==========')
  const deployer = await graph.accounts.getDeployer(args.accountIndex)
  console.log('Using deployer account:', deployer.address)
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Deployer balance:', ethers.formatEther(balance), 'ETH')
  if (balance === 0n) {
    console.error('Error: Deployer account has no ETH balance')
    process.exit(1)
  }

  // Deploy the contracts
  console.log(`\n========== 🚧 Deploy protocol ==========`)
  const DeployModule = (await import('../ignition/modules/deploy.js')).default
  const deployment = await ignition.deploy(DeployModule, {
    displayUi: true,
    parameters: HorizonConfig,
    defaultSender: deployer.address,
  })

  // Save the addresses to the address book
  console.log('\n========== 📖 Updating address book ==========')
  saveToAddressBook(deployment, graph.horizon.addressBook)
  console.log(`Address book at ${graph.horizon.addressBook.file} updated!`)

  console.log('\n\n🎉 ✨ 🚀 ✅ Deployment complete! 🎉 ✨ 🚀 ✅')
}

const deployMigrateAction: NewTaskActionFunction<DeployMigrateArgs> = async (args, hre) => {
  const step: number = args.step
  const patchConfigFlag: boolean = args.patchConfig

  await buildProductionArtifacts(hre)

  const connection = await hre.network.create()
  const { ethers, ignition } = connection
  const graph = await connection.graph()
  if (!args.hideBanner) {
    printHorizonBanner()
  }

  // Migration step to run
  console.log('\n========== 🏗️ Migration steps ==========')
  const validSteps = [1, 2, 3, 4]
  if (!validSteps.includes(step)) {
    console.error(`Error: Invalid migration step provided: ${step}`)
    console.error(`Valid steps are: ${validSteps.join(', ')}`)
    process.exit(1)
  }
  console.log(`Running migration step: ${step}`)

  // Load configuration for the migration
  console.log('\n========== ⚙️ Deployment configuration ==========')
  const { config: HorizonMigrateConfig, file } = loadConfig(
    './ignition/configs/',
    'migrate',
    args.horizonConfig ?? connection.networkName,
  )
  console.log(`Loaded migration configuration from ${file}`)

  // Display the deployer
  console.log('\n========== 🔑 Deployer account ==========')
  const deployer = await graph.accounts.getDeployer(args.accountIndex)
  console.log('Using deployer account:', deployer.address)
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Deployer balance:', ethers.formatEther(balance), 'ETH')
  if (balance === 0n) {
    console.error('Error: Deployer account has no ETH balance')
    process.exit(1)
  }

  // Run migration step
  console.log(`\n========== 🚧 Running migration: step ${step} ==========`)
  const MigrationModule = (await import(`../ignition/modules/migrate/migrate-${step}.js`)).default
  const deployment = await ignition.deploy(MigrationModule, {
    displayUi: true,
    parameters: patchConfigFlag
      ? _patchStepConfig(
          step,
          HorizonMigrateConfig,
          graph.horizon.addressBook,
          graph.subgraphService?.addressBook,
          args.standalone,
        )
      : HorizonMigrateConfig,
    deploymentId: `horizon-${connection.networkName}`,
    defaultSender: deployer.address,
  })

  // Update address book
  console.log('\n========== 📖 Updating address book ==========')
  saveToAddressBook(deployment, graph.horizon.addressBook)
  console.log(`Address book at ${graph.horizon.addressBook.file} updated!`)

  console.log(`\n\n🎉 ✨ 🚀 ✅ Migration step ${step} complete! 🎉 ✨ 🚀 ✅\n`)
}

export const deployProtocolTask = task(
  'deploy:protocol',
  'Deploy a new version of the Graph Protocol Horizon contracts - no data services deployed',
)
  .addOption({
    name: 'horizonConfig',
    description:
      'Name of the Horizon configuration file to use. Format is "protocol.<name>.json5", file must be in the "ignition/configs/" directory. Defaults to network name.',
    type: ArgumentType.STRING_WITHOUT_DEFAULT,
    defaultValue: undefined,
  })
  .addOption({
    name: 'accountIndex',
    description: 'Derivation path index for the account to use',
    type: ArgumentType.INT,
    defaultValue: 0,
  })
  .setAction(async () => ({ default: deployProtocolAction }))
  .build()

export const deployMigrateTask = task(
  'deploy:migrate',
  'Upgrade an existing version of the Graph Protocol v1 to Horizon - no data services deployed',
)
  .addOption({
    name: 'horizonConfig',
    description:
      'Name of the Horizon configuration file to use. Format is "migrate.<name>.json5", file must be in the "ignition/configs/" directory. Defaults to network name.',
    type: ArgumentType.STRING_WITHOUT_DEFAULT,
    defaultValue: undefined,
  })
  .addOption({
    name: 'step',
    description: 'Migration step to run (1, 2, 3 or 4)',
    type: ArgumentType.INT,
    defaultValue: 0,
  })
  .addOption({
    name: 'accountIndex',
    description: 'Derivation path index for the account to use',
    type: ArgumentType.INT,
    defaultValue: 0,
  })
  .addFlag({
    name: 'patchConfig',
    description: 'Patch configuration file using address book values - does not save changes',
  })
  .addFlag({
    name: 'standalone',
    description: 'Deploy horizon contracts in standalone mode - subgraph service hardcoded as zero address',
  })
  .addFlag({
    name: 'hideBanner',
    description: 'Hide the banner display',
  })
  .setAction(async () => ({ default: deployMigrateAction }))
  .build()

// This function patches the Ignition configuration object using an address book to fill in the gaps
// The resulting configuration is not saved back to the configuration file

function _patchStepConfig<ChainId extends number, ContractName extends string, HorizonContractName extends string>(
  step: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any,
  horizonAddressBook: AddressBook<ChainId, ContractName>,
  subgraphServiceAddressBook: AddressBook<ChainId, HorizonContractName> | undefined,
  standalone: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  let patchedConfig = config

  // Get the subgraph service address
  // Subgraph service address book might exist if we are running horizon + subgraph service
  // or it might not exist if we are running horizon standalone
  function getSubgraphServiceAddress() {
    if (
      subgraphServiceAddressBook === undefined ||
      !subgraphServiceAddressBook.entryExists('SubgraphService') ||
      standalone
    ) {
      return ZERO_ADDRESS
    }
    return subgraphServiceAddressBook.getEntry('SubgraphService').address
  }

  // Get the dispute manager address
  // Dispute manager address book might exist if we are running horizon + subgraph service
  // or it might not exist if we are running horizon standalone
  function getDisputeManagerAddress() {
    if (
      subgraphServiceAddressBook === undefined ||
      !subgraphServiceAddressBook.entryExists('DisputeManager') ||
      standalone
    ) {
      return ZERO_ADDRESS
    }
    return subgraphServiceAddressBook.getEntry('DisputeManager').address ?? ZERO_ADDRESS
  }

  switch (step) {
    case 2:
      const GraphPayments = horizonAddressBook.getEntry('GraphPayments')
      const PaymentsEscrow = horizonAddressBook.getEntry('PaymentsEscrow')
      patchedConfig = patchConfig(config, {
        $global: {
          graphPaymentsAddress: GraphPayments.address,
          paymentsEscrowAddress: PaymentsEscrow.address,
        },
      })
      break
    case 3:
      patchedConfig = patchConfig(patchedConfig, {
        $global: {
          subgraphServiceAddress: getSubgraphServiceAddress(),
        },
      })
      break
    case 4:
      const HorizonStaking = horizonAddressBook.getEntry('HorizonStaking')
      const L2Curation = horizonAddressBook.getEntry('L2Curation')
      const RewardsManager = horizonAddressBook.getEntry('RewardsManager')
      patchedConfig = patchConfig(patchedConfig, {
        $global: {
          subgraphServiceAddress: getSubgraphServiceAddress(),
          disputeManagerAddress: getDisputeManagerAddress(),
          horizonStakingImplementationAddress: HorizonStaking.implementation ?? ZERO_ADDRESS,
          curationImplementationAddress: L2Curation.implementation ?? ZERO_ADDRESS,
          rewardsManagerImplementationAddress: RewardsManager.implementation ?? ZERO_ADDRESS,
        },
      })
      break
  }

  return patchedConfig
}
