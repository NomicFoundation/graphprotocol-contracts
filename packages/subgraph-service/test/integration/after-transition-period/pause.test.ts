import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/types'
import { expect } from 'chai'
import hre from 'hardhat'

const connection = await hre.network.getOrCreate()
const { ethers } = connection
const graph = await connection.graph()

describe('Pausing', () => {
  let snapshotId: string

  // Test addresses
  let pauseGuardian: HardhatEthersSigner
  let governor: HardhatEthersSigner
  const subgraphService = graph.subgraphService.contracts.SubgraphService

  before(async () => {
    pauseGuardian = await graph.accounts.getPauseGuardian()
    governor = await graph.accounts.getGovernor()
  })

  beforeEach(async () => {
    // Take a snapshot before each test
    snapshotId = await ethers.provider.send('evm_snapshot', [])
  })

  afterEach(async () => {
    // Revert to the snapshot after each test
    await ethers.provider.send('evm_revert', [snapshotId])
  })

  describe('SubgraphService', () => {
    it('should be pausable by pause guardian', async () => {
      await subgraphService.connect(pauseGuardian).pause()
      expect(await subgraphService.paused()).to.equal(true)
    })

    it('should be pausable by governor', async () => {
      await subgraphService.connect(governor).pause()
      expect(await subgraphService.paused()).to.equal(true)
    })
  })
})
