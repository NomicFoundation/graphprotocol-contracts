# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is The Graph Protocol's smart contracts monorepo - a decentralized network for querying and indexing blockchain data. It uses pnpm workspaces to manage multiple packages.

## Key Commands

### Build and Development

```bash
# Install dependencies (uses pnpm)
pnpm install

# Build all packages
pnpm build

# Clean build artifacts
pnpm clean

# Deep clean (including node_modules)
pnpm clean:all
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Test a specific package
cd packages/<package-name> && pnpm test

# Test a single file (in contracts package)
cd packages/contracts && npx hardhat test test/<FILE_NAME>.ts

# Run Solidity tests natively on Hardhat 3 (horizon)
cd packages/horizon && pnpm test

# Run integration tests
cd packages/horizon && pnpm test:integration

# Run deployment tests
cd packages/horizon && pnpm test:deployment
```

### Linting and Formatting

```bash
# Run all linters
pnpm lint

# Format code
pnpm format

# Individual linters
pnpm lint:ts        # TypeScript/JavaScript
pnpm lint:sol       # Solidity
pnpm lint:natspec   # NatSpec comments
pnpm lint:md        # Markdown
pnpm lint:json      # JSON files
pnpm lint:yaml      # YAML files
```

## Architecture Overview

### Package Structure

1. **contracts** - Original Graph Protocol contracts (staking, curation, disputes)
   - Uses Hardhat for development
   - Contains E2E testing framework for protocol validation

2. **horizon** - Next iteration of The Graph protocol
   - Uses Hardhat 3 for building and testing (forge for linting only)
   - Deployment via Hardhat Ignition
   - Migration path from original protocol

3. **subgraph-service** - Data service implementation for Graph Horizon
   - Manages disputes and allocations
   - Part of the Horizon ecosystem

4. **interfaces** - Shared contract interfaces
   - Centralized repository for all Solidity contract interfaces
   - Used by multiple packages/programs for contract implementation and interaction
   - Generates TypeScript types for distribution via npm
   - Defaults to ethers v6 type generation
   - Includes Wagmi type generation support
   - Includes ethers v5 type generation
   - Published types can be imported by any TypeScript program

5. **token-distribution** - Token locking and vesting contracts
   - GraphTokenLockWallet and GraphTokenLockManager
   - L2 token distribution functionality

6. **toolshed** - Shared development utilities
   - Deployment helpers
   - Test fixtures
   - Hardhat extensions

### Key Architectural Patterns

- **Proxy Upgradeable Pattern**: Most contracts use OpenZeppelin's upgradeable proxy pattern
- **Storage Separation**: Storage contracts are separate from logic contracts
- **Governor/Controller Pattern**: Access control through Governor and Controller contracts
- **Modular Design**: Clear separation between protocol layers and services

### Testing Strategy

- **Unit Tests**: TypeScript tests using Hardhat Test Environment
- **Solidity Tests**: Solidity tests (`.t.sol` files) - run natively by Hardhat 3 in horizon, by Foundry in subgraph-service
- **Integration Tests**: Cross-contract interaction testing
- **E2E Tests**: Full protocol deployment and operation validation

### Deployment

- Contract addresses stored in `addresses.json` files per package
- Multi-network support (mainnet, testnets, Arbitrum chains)
- Hardhat Ignition for deployment management
- Migration scripts for upgrading from original protocol to Horizon

## Development Tips

### Working with Horizon

Horizon is on Hardhat 3; forge is only used for linting. When developing:

1. Use `pnpm test:self` (`hardhat test solidity`) for Solidity unit tests
2. Use `pnpm test:integration` for integration tests - requires `BLOCKCHAIN_RPC` (archive endpoint) and `FORK_BLOCK_NUMBER`
3. RPC URLs are plain environment variables (e.g. `ARBITRUM_SEPOLIA_RPC`); secrets go in the hardhat keystore

### Contract Verification

For contract verification on block explorers:

```bash
npx hardhat keystore set ETHERSCAN_API_KEY
```

### Changesets for Versioning

When making changes that should be published:

```bash
# Create a changeset
pnpm changeset

# Version packages (maintainer only)
pnpm changeset version

# Publish to npm (maintainer only)
pnpm changeset publish
```

### Security Considerations

- Audit reports available in `audits/` directories
- Use existing proxy patterns and access control mechanisms
- Follow established upgrade procedures for contract modifications
- Report security issues through Immunefi bounty program
