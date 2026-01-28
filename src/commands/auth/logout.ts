import {Command} from '@oclif/core'
import {removeApiKey, getConfigPath, getApiKey} from '../../lib/config.js'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'

export default class AuthLogout extends Command {
  static override description = 'Remove stored Linear API key'

  static override examples = ['<%= config.bin %> auth logout']

  public async run(): Promise<void> {
    await this.parse(AuthLogout)

    try {
      const apiKey = getApiKey()

      if (!apiKey) {
        throw new CliError(ErrorCodes.NOT_AUTHENTICATED, 'Not currently authenticated')
      }

      removeApiKey()

      print(
        success({
          message: 'Successfully logged out',
          configPath: getConfigPath(),
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
