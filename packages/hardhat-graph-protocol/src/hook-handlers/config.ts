import type { ConfigurationVariableResolver, HardhatConfig, HardhatUserConfig } from 'hardhat/types/config'
import type { ConfigHooks } from 'hardhat/types/hooks'
import path from 'path'

export default async (): Promise<Partial<ConfigHooks>> => ({
  resolveUserConfig,
})

async function resolveUserConfig(
  userConfig: HardhatUserConfig,
  resolveConfigurationVariable: ConfigurationVariableResolver,
  next: (
    nextUserConfig: HardhatUserConfig,
    nextResolveConfigurationVariable: ConfigurationVariableResolver,
  ) => Promise<HardhatConfig>,
): Promise<HardhatConfig> {
  const resolvedConfig = await next(userConfig, resolveConfigurationVariable)

  // Hardhat drops unknown per-network keys during resolution, so the
  // `deployments` entries have to be carried over from the user config.
  const resolvedNetworks = Object.fromEntries(
    Object.entries(resolvedConfig.networks).map(([networkName, networkConfig]) => [
      networkName,
      {
        ...networkConfig,
        deployments: userConfig.networks?.[networkName]?.deployments,
      },
    ]),
  )

  const userPath = userConfig.paths?.graph
  const configDir =
    resolvedConfig.paths.config === undefined ? resolvedConfig.paths.root : path.dirname(resolvedConfig.paths.config)
  const graphPath =
    userPath === undefined
      ? configDir
      : path.isAbsolute(userPath)
        ? userPath
        : path.normalize(path.join(configDir, userPath))

  return {
    ...resolvedConfig,
    graph: userConfig.graph,
    networks: resolvedNetworks,
    paths: {
      ...resolvedConfig.paths,
      graph: graphPath,
    },
  }
}
