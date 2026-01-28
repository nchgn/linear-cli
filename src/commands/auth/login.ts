import {Args, Command, Flags} from '@oclif/core'
import open from 'open'
import {createClient} from '../../lib/client.js'
import {saveApiKey, getConfigPath} from '../../lib/config.js'
import {success, error, print} from '../../lib/output.js'
import {handleError} from '../../lib/errors.js'
import {colors} from '../../lib/formatter.js'

const LINEAR_API_SETTINGS_URL = 'https://linear.app/settings/api'

export default class AuthLogin extends Command {
  static override description = 'Authenticate with Linear using an API key'

  static override examples = [
    '<%= config.bin %> auth login --key lin_api_xxxxx',
    '<%= config.bin %> auth login --browser',
    'LINEAR_API_KEY=lin_api_xxxxx <%= config.bin %> auth login',
  ]

  static override flags = {
    key: Flags.string({
      char: 'k',
      description: 'Linear API key (or set LINEAR_API_KEY env var)',
      env: 'LINEAR_API_KEY',
    }),
    browser: Flags.boolean({
      char: 'b',
      description: 'Open Linear API settings in browser to create a key',
      default: false,
    }),
  }

  static override args = {
    key: Args.string({
      description: 'Linear API key (alternative to --key flag)',
      required: false,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(AuthLogin)
      const apiKey = flags.key || args.key

      // If --browser flag, open Linear API settings
      if (flags.browser) {
        await open(LINEAR_API_SETTINGS_URL)
        print(
          success({
            message: 'Opened Linear API settings in browser',
            url: LINEAR_API_SETTINGS_URL,
            instructions: [
              '1. Click "Create key" or "New API key"',
              '2. Give it a label (e.g., "CLI")',
              '3. Copy the generated key (starts with lin_api_)',
              '4. Run: linear auth login --key YOUR_KEY',
            ],
          }),
        )
        return
      }

      // If no API key provided, show helpful instructions
      if (!apiKey) {
        console.log(colors.bold('\nTo authenticate with Linear CLI, you need an API key.\n'))
        console.log(colors.cyan('Option 1: Open browser to create a key'))
        console.log('  linear auth login --browser\n')
        console.log(colors.cyan('Option 2: If you already have a key'))
        console.log('  linear auth login --key lin_api_xxxxx\n')
        console.log(colors.cyan('Option 3: Set environment variable'))
        console.log('  export LINEAR_API_KEY=lin_api_xxxxx\n')
        console.log(colors.dim(`Manual URL: ${LINEAR_API_SETTINGS_URL}`))
        console.log('')

        print(
          error(
            'MISSING_API_KEY',
            'No API key provided. Use --browser to create one or --key to provide an existing key.',
            {url: LINEAR_API_SETTINGS_URL},
          ),
        )
        this.exit(1)
        return
      }

      // Validate the API key by making a test request
      const client = createClient(apiKey)
      const viewer = await client.viewer

      // Save the API key
      saveApiKey(apiKey)

      print(
        success({
          message: 'Successfully authenticated',
          user: {
            id: viewer.id,
            name: viewer.name,
            email: viewer.email,
          },
          configPath: getConfigPath(),
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
