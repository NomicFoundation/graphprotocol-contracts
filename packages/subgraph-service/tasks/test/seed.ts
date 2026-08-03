import {
  encodeRegistrationData,
  encodeStartServiceData,
  generateAllocationProof,
  PaymentTypes,
} from '@graphprotocol/toolshed'
import { indexersData as indexers } from '@graphprotocol/toolshed/fixtures'
import { requireLocalNetwork } from '@graphprotocol/toolshed/hardhat'
import { task } from 'hardhat/config'
import type { NewTaskActionFunction } from 'hardhat/types/tasks'

const seedAction: NewTaskActionFunction = async (_, hre) => {
  const connection = await hre.network.create()
  const { ethers } = connection

  // this task impersonates indexer accounts so we NEED a local network
  requireLocalNetwork(connection.networkName)

  // Get contracts
  const graph = await connection.graph()
  const horizonStaking = graph.horizon.contracts.HorizonStaking
  const subgraphService = graph.subgraphService.contracts.SubgraphService
  const disputeManager = graph.subgraphService.contracts.DisputeManager

  // Get contract addresses
  const subgraphServiceAddress = await subgraphService.getAddress()

  // Get chain id
  const chainId = (await ethers.provider.getNetwork()).chainId

  // Get configs
  const disputePeriod = await disputeManager.getDisputePeriod()
  const maxSlashingCut = await disputeManager.maxSlashingCut()

  // Legacy allocations are not closed: the horizon staking contract no longer
  // exposes the transition-period closeAllocation, and its idle stake accounting
  // already treats tokens allocated pre-horizon as unallocated

  console.log('\n--- STEP 1: Create provisions, set delegation cuts and register indexers ---')

  for (const indexer of indexers) {
    // Create provision
    console.log(`Creating subgraph service provision for indexer: ${indexer.address}`)
    const indexerSigner = await ethers.getImpersonatedSigner(indexer.address)
    await horizonStaking
      .connect(indexerSigner)
      .provision(
        indexer.address,
        await subgraphService.getAddress(),
        indexer.provisionTokens,
        maxSlashingCut,
        disputePeriod,
      )
    console.log(`Provision created for indexer with ${indexer.provisionTokens} tokens`)

    // Set delegation fee cut
    console.log(`Setting delegation fee cut for indexer: ${indexer.address}`)
    await horizonStaking
      .connect(indexerSigner)
      .setDelegationFeeCut(
        indexer.address,
        subgraphServiceAddress,
        PaymentTypes.IndexingRewards,
        indexer.indexingRewardCut,
      )
    await horizonStaking
      .connect(indexerSigner)
      .setDelegationFeeCut(indexer.address, subgraphServiceAddress, PaymentTypes.QueryFee, indexer.queryFeeCut)

    // Register indexer
    console.log(`Registering indexer: ${indexer.address}`)
    const indexerRegistrationData = encodeRegistrationData(
      indexer.url,
      indexer.geoHash,
      indexer.rewardsDestination || ethers.ZeroAddress,
    )
    await subgraphService.connect(indexerSigner).register(indexerSigner.address, indexerRegistrationData)

    const indexerData = await subgraphService.indexers(indexerSigner.address)

    console.log(`Indexer registered at: ${indexerData.url} - ${indexerData.geoHash}`)
  }

  console.log('\n--- STEP 2: Start allocations ---')

  for (const indexer of indexers) {
    // Skip indexers with no allocations
    if (indexer.allocations.length === 0) {
      continue
    }

    console.log(`Starting allocations for indexer: ${indexer.address}`)

    const indexerSigner = await ethers.getImpersonatedSigner(indexer.address)

    for (const allocation of indexer.allocations) {
      console.log(`Starting allocation: ${allocation.allocationID}`)

      // Build allocation proof
      const signature = await generateAllocationProof(
        indexer.address,
        allocation.allocationPrivateKey,
        subgraphServiceAddress,
        Number(chainId),
      )
      const subgraphDeploymentId = allocation.subgraphDeploymentID
      const allocationTokens = allocation.tokens
      const allocationId = allocation.allocationID

      // Attempt to create an allocation with the same ID
      const data = encodeStartServiceData(subgraphDeploymentId, allocationTokens, allocationId, signature)

      // Start allocation
      await subgraphService.connect(indexerSigner).startService(indexerSigner.address, data)

      console.log(`Allocation started with tokens: ${allocationTokens}`)
    }
  }
}

const seedTask = task('test:seed', 'Seed the test environment, must be run after deployment')
  .setAction(async () => ({ default: seedAction }))
  .build()

export default seedTask
