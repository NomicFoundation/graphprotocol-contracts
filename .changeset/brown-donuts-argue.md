---
'hardhat-graph-protocol': minor
---

Rewritten as a Hardhat 3 plugin. The Graph runtime environment is no longer available as `hre.graph()`; it is loaded lazily from a network connection with `await connection.graph(options?)`. Deployments whose address book cannot be resolved are skipped with a log instead of failing the whole environment.
