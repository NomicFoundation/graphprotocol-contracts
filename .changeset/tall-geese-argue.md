---
'@graphprotocol/subgraph-service': patch
---

Added the deployed RecurringCollector proxy address to the Arbitrum One and Arbitrum Sepolia migration configs. Migration step 2 requires it, and running the step without --patch-config would previously fail because the parameter was missing.
