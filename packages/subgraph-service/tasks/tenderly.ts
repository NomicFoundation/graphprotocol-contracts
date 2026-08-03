import fs from 'node:fs'
import { createRequire } from 'node:module'

import { type AddressBookJson, runTenderlyUpload } from '@graphprotocol/toolshed/hardhat'
import { task } from 'hardhat/config'
import type { NewTaskActionFunction } from 'hardhat/types/tasks'
import path from 'path'

interface TenderlyUploadArgs {
  noVerify: boolean
  skipAdd: boolean
}

const tenderlyUploadAction: NewTaskActionFunction<TenderlyUploadArgs> = async (taskArgs, hre) => {
  // Load the tenderly packages only when this task runs: they are not declared as
  // dependencies (no Hardhat 3 compatible release exists) so this task is kept as
  // unregistered dead code until one is available
  const require = createRequire(import.meta.url)
  const { Tenderly } = require('@tenderly/hardhat-integration')
  const { configExists, getAccessToken } = require('@tenderly/api-client/utils/config')

  if (!configExists()) {
    throw new Error(
      'Tenderly config not found. Run `tenderly login` to authenticate, or create ~/.tenderly/config.yaml manually.',
    )
  }

  const connection = await hre.network.create()

  const tenderly = new Tenderly(hre)
  const accessToken = getAccessToken()
  const packageDir = path.join(import.meta.dirname, '..')

  const addresses: AddressBookJson = JSON.parse(fs.readFileSync(path.join(packageDir, 'addresses.json'), 'utf8'))
  await runTenderlyUpload(
    connection.networkName,
    connection.networkConfig.chainId,
    tenderly,
    packageDir,
    addresses,
    accessToken,
    taskArgs,
  )
}

const tenderlyUploadTask = task('tenderly:upload', 'Upload and verify contracts on Tenderly')
  .addFlag({
    name: 'noVerify',
    description: 'Skip contract verification',
  })
  .addFlag({
    name: 'skipAdd',
    description: 'Skip adding contracts (only verify)',
  })
  .setAction(async () => ({ default: tenderlyUploadAction }))
  .build()

// Not registered in the hardhat config: no Hardhat 3 compatible Tenderly plugin
// exists yet. Kept for reference until one is available.
export default tenderlyUploadTask
