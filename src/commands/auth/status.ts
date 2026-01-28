import {Command} from '@oclif/core'
import {getApiKey, getConfigPath} from '../../lib/config.js'
import {createClient} from '../../lib/client.js'
import {success, print} from '../../lib/output.js'
import {handleError} from '../../lib/errors.js'

export default class AuthStatus extends Command {
  static override description = 'Check authentication status'

  static override examples = ['<%= config.bin %> auth status']

  public async run(): Promise<void> {
    await this.parse(AuthStatus)

    try {
      const apiKey = getApiKey()

      if (!apiKey) {
        print(
          success({
            authenticated: false,
            message: 'Not authenticated',
            configPath: getConfigPath(),
          }),
        )
        return
      }

      // Verify the API key is still valid
      const client = createClient(apiKey)
      const viewer = await client.viewer

      print(
        success({
          authenticated: true,
          user: {
            id: viewer.id,
            name: viewer.name,
            email: viewer.email,
          },
          source: process.env.LINEAR_API_KEY ? 'environment' : 'config',
          configPath: getConfigPath(),
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
