import {Args, Command, Flags} from '@oclif/core';
import {createClient} from '../../lib/client.js';
import {saveApiKey, getConfigPath} from '../../lib/config.js';
import {success, print} from '../../lib/output.js';
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js';

export default class AuthLogin extends Command {
  static override description = 'Authenticate with Linear using an API key';

  static override examples = [
    '<%= config.bin %> auth login --key lin_api_xxxxx',
    'LINEAR_API_KEY=lin_api_xxxxx <%= config.bin %> auth login',
  ];

  static override flags = {
    key: Flags.string({
      char: 'k',
      description: 'Linear API key (or set LINEAR_API_KEY env var)',
      env: 'LINEAR_API_KEY',
    }),
  };

  static override args = {
    key: Args.string({
      description: 'Linear API key (alternative to --key flag)',
      required: false,
    }),
  };

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(AuthLogin);
      const apiKey = flags.key || args.key;

      if (!apiKey) {
        throw new CliError(
          ErrorCodes.MISSING_REQUIRED_FIELD,
          'API key is required. Use --key flag or set LINEAR_API_KEY environment variable.'
        );
      }

      // Validate the API key by making a test request
      const client = createClient(apiKey);
      const viewer = await client.viewer;

      // Save the API key
      saveApiKey(apiKey);

      print(
        success({
          message: 'Successfully authenticated',
          user: {
            id: viewer.id,
            name: viewer.name,
            email: viewer.email,
          },
          configPath: getConfigPath(),
        })
      );
    } catch (err) {
      handleError(err);
      this.exit(1);
    }
  }
}
