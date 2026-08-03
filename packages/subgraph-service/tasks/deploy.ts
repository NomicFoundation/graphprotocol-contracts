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
  subgraphServiceConfig?: string
  horizonConfig?: string
  accountIndex: number
}

interface DeployMigrateArgs {
  subgraphServiceConfig?: string
  step: number
  accountIndex: number
  patchConfig: boolean
  hideBanner: boolean
}

// Deployed bytecode must come from the production build profile - the default
// profile skips viaIR and the optimizer for fast iteration
async function buildProductionArtifacts(hre: HardhatRuntimeEnvironment) {
  await hre.tasks.getTask('build').run({ defaultBuildProfile: 'production', noTests: true, quiet: true })
}

// Horizon needs the SubgraphService proxy address before it can be deployed
// But SubgraphService and DisputeManager implementations need Horizon...
// So the deployment order is:
// - Deploy SubgraphService and DisputeManager proxies
// - Deploy Horizon
// - Deploy SubgraphService and DisputeManager implementations
const deployProtocolAction: NewTaskActionFunction<DeployProtocolArgs> = async (args, hre) => {
  await buildProductionArtifacts(hre)

  const connection = await hre.network.create()
  const { ethers, ignition } = connection
  const graph = await connection.graph({ createAddressBook: true })

  // Load configuration files for the deployment
  console.log('\n========== ⚙️ Deployment configuration ==========')
  const { config: HorizonConfig, file: horizonFile } = loadConfig(
    './node_modules/@graphprotocol/horizon/ignition/configs',
    'protocol',
    args.horizonConfig ?? connection.networkName,
  )
  const { config: SubgraphServiceConfig, file: subgraphServiceFile } = loadConfig(
    './ignition/configs/',
    'protocol',
    args.subgraphServiceConfig ?? connection.networkName,
  )
  console.log(`Loaded Horizon migration configuration from ${horizonFile}`)
  console.log(`Loaded Subgraph Service migration configuration from ${subgraphServiceFile}`)

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

  // 1. Deploy SubgraphService and DisputeManager proxies
  console.log(`\n========== 🚧 SubgraphService and DisputeManager proxies ==========`)
  const Deploy1Module = (await import('../ignition/modules/deploy/deploy-1.js')).default
  const proxiesDeployment = await ignition.deploy(Deploy1Module, {
    displayUi: true,
    parameters: SubgraphServiceConfig,
    defaultSender: deployer.address,
  })

  // 2. Deploy Horizon
  console.log(`\n========== 🚧 Deploy Horizon ==========`)
  const { HorizonModule } = await import('@graphprotocol/horizon/ignition')
  const horizonDeployment = await ignition.deploy(HorizonModule, {
    displayUi: true,
    parameters: patchConfig(HorizonConfig, {
      $global: {
        // The naming convention in the horizon package is slightly different
        subgraphServiceAddress: proxiesDeployment.Transparent_Proxy_SubgraphService.target as string,
      },
    }),
    defaultSender: deployer.address,
  })

  // 3. Deploy SubgraphService and DisputeManager implementations
  console.log(`\n========== 🚧 Deploy SubgraphService implementations and upgrade them ==========`)
  const Deploy2Module = (await import('../ignition/modules/deploy/deploy-2.js')).default
  const subgraphServiceDeployment = await ignition.deploy(Deploy2Module, {
    displayUi: true,
    parameters: patchConfig(SubgraphServiceConfig, {
      $global: {
        controllerAddress: horizonDeployment.Controller.target as string,
        curationProxyAddress: horizonDeployment.Graph_Proxy_L2Curation.target as string,
        curationImplementationAddress: horizonDeployment.Implementation_L2Curation.target as string,
        disputeManagerProxyAddress: proxiesDeployment.Transparent_Proxy_DisputeManager.target as string,
        disputeManagerProxyAdminAddress: proxiesDeployment.Transparent_ProxyAdmin_DisputeManager.target as string,
        subgraphServiceProxyAddress: proxiesDeployment.Transparent_Proxy_SubgraphService.target as string,
        subgraphServiceProxyAdminAddress: proxiesDeployment.Transparent_ProxyAdmin_SubgraphService.target as string,
        graphTallyCollectorAddress: horizonDeployment.GraphTallyCollector.target as string,
        recurringCollectorAddress: horizonDeployment.Transparent_Proxy_RecurringCollector.target as string,
        gnsProxyAddress: horizonDeployment.Graph_Proxy_L2GNS.target as string,
        gnsImplementationAddress: horizonDeployment.Implementation_L2GNS.target as string,
        subgraphNFTAddress: horizonDeployment.SubgraphNFT.target as string,
      },
    }),
    defaultSender: deployer.address,
  })

  // Save the addresses to the address book
  console.log('\n========== 📖 Updating address book ==========')
  saveToAddressBook(horizonDeployment, graph.horizon.addressBook)
  saveToAddressBook(proxiesDeployment, graph.subgraphService.addressBook)
  saveToAddressBook(subgraphServiceDeployment, graph.subgraphService.addressBook)
  console.log(`Address book at ${graph.horizon.addressBook.file} updated!`)
  console.log(`Address book at ${graph.subgraphService.addressBook.file} updated!`)
  console.log('Note that Horizon deployment addresses are updated in the Horizon address book')

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
  const validSteps = [1, 2]
  if (!validSteps.includes(step)) {
    console.error(`Error: Invalid migration step provided: ${step}`)
    console.error(`Valid steps are: ${validSteps.join(', ')}`)
    process.exit(1)
  }
  console.log(`Running migration step: ${step}`)

  // Load configuration for the migration
  console.log('\n========== ⚙️ Deployment configuration ==========')
  const { config: SubgraphServiceMigrateConfig, file } = loadConfig(
    './ignition/configs/',
    'migrate',
    args.subgraphServiceConfig ?? connection.networkName,
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
          SubgraphServiceMigrateConfig,
          graph.subgraphService.addressBook,
          graph.horizon.addressBook,
        )
      : SubgraphServiceMigrateConfig,
    deploymentId: `subgraph-service-${connection.networkName}`,
    defaultSender: deployer.address,
  })

  // Update address book
  console.log('\n========== 📖 Updating address book ==========')
  saveToAddressBook(deployment, graph.subgraphService.addressBook)
  console.log(`Address book at ${graph.subgraphService.addressBook.file} updated!`)

  console.log('\n\n🎉 ✨ 🚀 ✅ Migration complete! 🎉 ✨ 🚀 ✅')
}

export const deployProtocolTask = task(
  'deploy:protocol',
  'Deploy a new version of the Graph Protocol Horizon contracts - with Subgraph Service',
)
  .addOption({
    name: 'subgraphServiceConfig',
    description:
      'Name of the Subgraph Service configuration file to use. Format is "protocol.<name>.json5", file must be in the "ignition/configs/" directory. Defaults to network name.',
    type: ArgumentType.STRING_WITHOUT_DEFAULT,
    defaultValue: undefined,
  })
  .addOption({
    name: 'horizonConfig',
    description:
      'Name of the Horizon configuration file to use. Format is "protocol.<name>.json5", file must be in the "ignition/configs/" directory in the horizon package. Defaults to network name.',
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

export const deployMigrateTask = task('deploy:migrate', 'Deploy the Subgraph Service on an existing Horizon deployment')
  .addOption({
    name: 'subgraphServiceConfig',
    description:
      'Name of the Subgraph Service configuration file to use. Format is "migrate.<name>.json5", file must be in the "ignition/configs/" directory. Defaults to network name.',
    type: ArgumentType.STRING_WITHOUT_DEFAULT,
    defaultValue: undefined,
  })
  .addOption({
    name: 'step',
    description: 'Migration step to run (1, 2)',
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
  addressBook: AddressBook<ChainId, ContractName>,
  horizonAddressBook: AddressBook<ChainId, HorizonContractName>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  let patchedConfig = config

  switch (step) {
    case 2:
      const SubgraphService = addressBook.getEntry('SubgraphService')
      const DisputeManager = addressBook.getEntry('DisputeManager')
      const GraphTallyCollector = horizonAddressBook.getEntry('GraphTallyCollector')

      // The RecurringCollector is not deployed by the horizon migrate flow, so it
      // might not exist on the network being migrated
      const recurringCollectorAddress = horizonAddressBook.entryExists('RecurringCollector')
        ? horizonAddressBook.getEntry('RecurringCollector').address
        : ZERO_ADDRESS

      patchedConfig = patchConfig(config, {
        $global: {
          disputeManagerProxyAddress: DisputeManager.address,
          disputeManagerProxyAdminAddress: DisputeManager.proxyAdmin ?? ZERO_ADDRESS,
          subgraphServiceProxyAddress: SubgraphService.address,
        },
        SubgraphService: {
          subgraphServiceProxyAdminAddress: SubgraphService.proxyAdmin ?? ZERO_ADDRESS,
          graphTallyCollectorAddress: GraphTallyCollector.address,
          recurringCollectorAddress,
        },
      })
      break
  }

  return patchedConfig
}
