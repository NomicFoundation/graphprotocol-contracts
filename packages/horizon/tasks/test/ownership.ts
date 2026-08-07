import { requireLocalNetwork } from '@graphprotocol/toolshed/hardhat'
import { printBanner } from '@graphprotocol/toolshed/utils'
import { task } from 'hardhat/config'
import { ArgumentType } from 'hardhat/types/arguments'
import type { NewTaskActionFunction } from 'hardhat/types/tasks'

interface TransferOwnershipArgs {
  governorIndex: number
  slasherIndex: number
  pauseGuardianIndex: number
}

// This is required because we cannot impersonate Ignition accounts
// so we impersonate current governor and transfer ownership to accounts that Ignition can control
const transferOwnershipAction: NewTaskActionFunction<TransferOwnershipArgs> = async (taskArgs, hre) => {
  printBanner('TRANSFER OWNERSHIP')

  const connection = await hre.network.create()
  const { ethers } = connection

  // this task uses impersonation so we NEED a local network
  requireLocalNetwork(connection.networkName)

  console.log('\n--- STEP 0: Setup ---')

  // Get signers
  const graph = await connection.graph()
  const newGovernor = await graph.accounts.getGovernor(taskArgs.governorIndex)
  const newSlasher = await graph.accounts.getArbitrator(taskArgs.slasherIndex)
  const newPauseGuardian = await graph.accounts.getPauseGuardian(taskArgs.pauseGuardianIndex)
  console.log(`New governor will be: ${newGovernor.address}`)

  // Get contracts
  const staking = graph.horizon.contracts.LegacyStaking
  const controller = graph.horizon.contracts.Controller
  const graphProxyAdmin = graph.horizon.contracts.GraphProxyAdmin

  // Get current owners
  const controllerGovernor = await controller.getGovernor()
  const proxyAdminGovernor = await graphProxyAdmin.governor()

  console.log(`Current Controller governor: ${controllerGovernor}`)
  console.log(`Current GraphProxyAdmin governor: ${proxyAdminGovernor}`)

  // Get impersonated signers
  const controllerSigner = await ethers.getImpersonatedSigner(controllerGovernor)
  const proxyAdminSigner = await ethers.getImpersonatedSigner(proxyAdminGovernor)

  console.log('\n--- STEP 1: Transfer ownership of Controller ---')

  // Transfer Controller ownership
  console.log('Transferring Controller ownership...')
  await controller.connect(controllerSigner).transferOwnership(newGovernor.address)
  console.log('Accepting Controller ownership...')

  // Accept ownership of Controller
  await controller.connect(newGovernor).acceptOwnership()
  console.log(`New Controller governor: ${await controller.getGovernor()}`)

  console.log('\n--- STEP 2: Transfer ownership of GraphProxyAdmin ---')

  // Transfer GraphProxyAdmin ownership
  console.log('Transferring GraphProxyAdmin ownership...')
  await graphProxyAdmin.connect(proxyAdminSigner).transferOwnership(newGovernor.address)
  console.log('Accepting GraphProxyAdmin ownership...')

  // Accept ownership of GraphProxyAdmin
  await graphProxyAdmin.connect(newGovernor).acceptOwnership()
  console.log(`New GraphProxyAdmin governor: ${await graphProxyAdmin.governor()}`)

  console.log('\n--- STEP 3: Assign new slasher ---')

  // Assign new slasher
  console.log('Assigning new slasher...')
  await staking.connect(newGovernor).setSlasher(newSlasher.address, true)
  console.log(`New slasher: ${newSlasher.address}, allowed: ${await staking.slashers(newSlasher.address)}`)

  // Assign new pause guardian
  console.log('Assigning new pause guardian...')
  await controller.connect(newGovernor).setPauseGuardian(newPauseGuardian.address)
  console.log(`New pause guardian: ${newPauseGuardian.address}`)

  console.log('\n\n🎉 ✨ 🚀 ✅ Transfer ownership complete! 🎉 ✨ 🚀 ✅\n')
}

const transferOwnershipTask = task(
  'test:transfer-ownership',
  'Transfer ownership of protocol contracts to a new governor',
)
  .addOption({
    name: 'governorIndex',
    description: 'Derivation path index for the new governor account',
    type: ArgumentType.INT,
    defaultValue: 1,
  })
  .addOption({
    name: 'slasherIndex',
    description: 'Derivation path index for the new slasher account',
    type: ArgumentType.INT,
    defaultValue: 2,
  })
  .addOption({
    name: 'pauseGuardianIndex',
    description: 'Derivation path index for the new pause guardian account',
    type: ArgumentType.INT,
    defaultValue: 3,
  })
  .setAction(async () => ({ default: transferOwnershipAction }))
  .build()

export default transferOwnershipTask
