# 🌅 Subgraph Service 🌅

The Subgraph Service is a data service designed to work with Graph Horizon that supports indexing subgraphs and serving queries to consumers.

## Configuration

Secrets are managed with the [hardhat keystore](https://hardhat.org/docs/learn-more/configuration-variables) and can alternatively be provided as environment variables:

| Variable               | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `ETHERSCAN_API_KEY`    | Etherscan v2 API key - for contract verification              |
| `DEPLOYER_PRIVATE_KEY` | Deployer account private key - for deploying to live networks |

```bash
npx hardhat keystore set <variable>
```

RPC URLs are plain environment variables:

| Variable               | Description                                                                     |
| ---------------------- | ------------------------------------------------------------------------------- |
| `ARBITRUM_ONE_RPC`     | Arbitrum One RPC URL - defaults to `https://arb1.arbitrum.io/rpc`               |
| `ARBITRUM_SEPOLIA_RPC` | Arbitrum Sepolia RPC URL - defaults to `https://sepolia-rollup.arbitrum.io/rpc` |
| `LOCALHOST_RPC`        | Localhost RPC URL - defaults to `http://localhost:8545`                         |
| `BLOCKCHAIN_RPC`       | RPC URL the integration tests fork from - requires an archive endpoint          |
| `FORK_BLOCK_NUMBER`    | Block number the integration tests fork at                                      |

## Build

```bash
pnpm install
pnpm build
```

## Deployment

Note that this instructions will help you deploy Graph Horizon contracts alongside the Subgraph Service. If you want to deploy just the core Horizon contracts please refer to the [Horizon README](../horizon/README.md) for deploy instructions.

### New deployment

To deploy Graph Horizon from scratch including the Subgraph Service run the following command:

```bash
npx hardhat deploy:protocol
```

### Upgrade deployment

Usually you would run this against a network (or a fork) where the original Graph Protocol was previously deployed. To upgrade an existing deployment of the original Graph Protocol to Graph Horizon including the Subgraph Service, run the following commands. Note that some steps might need to be run by different accounts (deployer vs governor):

```bash
cd ../
cd horizon && npx hardhat deploy:migrate --step 1 && cd ..
cd subgraph-service && npx hardhat deploy:migrate --step 1 && cd ..
cd horizon && npx hardhat deploy:migrate --step 2 && cd .. # Run with governor. Optionally add --patch-config
cd horizon && npx hardhat deploy:migrate --step 3 && cd .. # Optionally add --patch-config
cd subgraph-service && npx hardhat deploy:migrate --step 2 && cd .. # Optionally add --patch-config
cd horizon && npx hardhat deploy:migrate --step 4 && cd .. # Run with governor. Optionally add --patch-config
```

Horizon Steps 2, 3 and 4, and Subgraph Service Step 2 require patching the configuration file with addresses from previous steps. The files are located in the `ignition/configs` directory and need to be manually edited. You can also pass `--patch-config` flag to the deploy command to automatically patch the configuration reading values from the address book. Note that this will NOT update the configuration file.

## Testing

- **unit**: Unit tests can be run with `pnpm test`
- **integration**: Integration tests can be run with `pnpm test:integration` - Need to set `BLOCKCHAIN_RPC` (falls back to `ARBITRUM_SEPOLIA_RPC`) to an **archive** RPC endpoint for a chain where the original Graph Protocol is deployed, and `FORK_BLOCK_NUMBER` to a block at which it had not yet been migrated to Horizon (the seed sets up pre-migration state)
- **deployment**: Deployment tests can be run with `pnpm test:deployment --network <network>`, the following environment variables allow customizing the test suite for different scenarios:
  - `TEST_DEPLOYMENT_STEP` (default: 1) - Specify the latest deployment step that has been executed. Tests for later steps will be skipped.
  - `TEST_DEPLOYMENT_TYPE` (default: migrate) - The deployment type `protocol/migrate` that is being tested. Test suite has been developed for `migrate` use case but can be run against a `protocol` deployment, likely with some failed tests.
  - `TEST_DEPLOYMENT_CONFIG` (default: the connection's network name) - The Ignition config file name to use for the test suite.

## Verification

To verify contracts on a network, run the following commands:

```bash
./scripts/pre-verify <ignition-deployment-id>
npx hardhat ignition verify --network <network> --include-unrelated-contracts <ignition-deployment-id>
./scripts/post-verify
```
