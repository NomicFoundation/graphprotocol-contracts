import { hardhatBaseConfig } from '@graphprotocol/toolshed/hardhat'
import hardhatKeystore from '@nomicfoundation/hardhat-keystore'
import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers'
import hardhatTypechain from '@nomicfoundation/hardhat-typechain'
import hardhatVerify from '@nomicfoundation/hardhat-verify'
import hardhatContractSizer from '@solidstate/hardhat-contract-sizer'
import { defineConfig } from 'hardhat/config'
import hardhatGraphProtocol from 'hardhat-graph-protocol'

const baseConfig = hardhatBaseConfig(import.meta)

export default defineConfig({
  ...baseConfig,
  plugins: [
    hardhatToolboxMochaEthers,
    hardhatGraphProtocol,
    hardhatTypechain,
    hardhatVerify,
    hardhatContractSizer,
    hardhatKeystore,
  ],
  solidity: {
    ...baseConfig.solidity,
    // Artifacts are only emitted for contracts under `paths.sources` and for npm
    // files listed here. The OZ proxy contracts are deployed by the Ignition
    // proxy modules, which need their artifacts (and TypeChain types) available.
    npmFilesToBuild: [
      '@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol',
      '@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol',
    ],
  },
  typechain: {
    outDir: 'typechain-types',
  },
})
