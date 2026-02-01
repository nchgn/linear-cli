import {Args, Command} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'

export default class InitiativesDelete extends Command {
  static override description = 'Delete an initiative (moves to trash)'

  static override examples = ['<%= config.bin %> initiatives delete INITIATIVE_ID']

  static override args = {
    id: Args.string({
      description: 'Initiative ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args} = await this.parse(InitiativesDelete)
      const client = getClient()

      const payload = await client.deleteInitiative(args.id)

      if (!payload.success) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to delete initiative')
      }

      print(
        success({
          id: args.id,
          deleted: true,
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
