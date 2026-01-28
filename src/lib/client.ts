import {LinearClient} from '@linear/sdk';
import {requireApiKey} from './config.js';

/**
 * Get a Linear client instance authenticated with the configured API key.
 * Creates a new instance on each call (CLI commands are ephemeral).
 *
 * @returns A configured LinearClient instance
 * @throws {CliError} When no API key is configured (NOT_AUTHENTICATED)
 */
export const getClient = (): LinearClient => {
  const apiKey = requireApiKey();
  return new LinearClient({apiKey});
};

/**
 * Create a new Linear client with a specific API key.
 * Useful for testing auth without saving the key.
 *
 * @param apiKey - Linear API key to authenticate with
 * @returns A configured LinearClient instance
 */
export const createClient = (apiKey: string): LinearClient => {
  return new LinearClient({apiKey});
};
