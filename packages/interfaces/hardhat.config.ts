import hardhatEthers from '@nomicfoundation/hardhat-ethers'
import hardhatTypechain from '@nomicfoundation/hardhat-typechain'
import { defineConfig } from 'hardhat/config'
import ignoreWarnings from 'hardhat-ignore-warnings'

export default defineConfig({
  plugins: [hardhatEthers, hardhatTypechain, ignoreWarnings],
  solidity: {
    compilers: [{ version: '0.8.35' }, { version: '0.7.6' }],
    // These OpenZeppelin interfaces are part of this package's published
    // TypeChain surface (e.g. IERC165__factory), so we generate artifacts
    // for them to ensure that TypeChain can generate the corresponding types.
    npmFilesToBuild: [
      '@openzeppelin/contracts/introspection/IERC165.sol',
      '@openzeppelin/contracts/token/ERC20/IERC20.sol',
      '@openzeppelin/contracts/token/ERC721/IERC721.sol',
      '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol',
    ],
  },
  typechain: {
    outDir: 'types',
  },
  warnings: {
    'contracts/token-distribution/IGraphTokenLockWallet.sol': {
      default: 'off',
    },
    'contracts/toolshed/IGraphTokenLockWalletToolshed.sol': {
      default: 'off',
    },
  },
})
