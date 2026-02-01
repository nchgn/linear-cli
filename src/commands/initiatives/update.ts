import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {LinearDocument} from '@linear/sdk'

type InitiativeUpdateInput = LinearDocument.InitiativeUpdateInput
const InitiativeStatus = LinearDocument.InitiativeStatus

export default class InitiativesUpdate extends Command {
  static override description = 'Update an initiative'

  static override examples = [
    '<%= config.bin %> initiatives update INITIATIVE_ID --name "New Name"',
    '<%= config.bin %> initiatives update INITIATIVE_ID --status Completed',
    '<%= config.bin %> initiatives update INITIATIVE_ID --target-date 2024-12-31',
  ]

  static override args = {
    id: Args.string({
      description: 'Initiative ID',
      required: true,
    }),
  }

  static override flags = {
    name: Flags.string({
      char: 'n',
      description: 'New initiative name',
    }),
    description: Flags.string({
      char: 'd',
      description: 'New description',
    }),
    status: Flags.string({
      char: 's',
      description: 'New status',
      options: ['Planned', 'Active', 'Completed'],
    }),
    'target-date': Flags.string({
      description: 'New target completion date (YYYY-MM-DD)',
    }),
    'owner-id': Flags.string({
      description: 'New owner user ID',
    }),
    icon: Flags.string({
      description: 'New initiative icon (emoji)',
    }),
    color: Flags.string({
      description: 'New initiative color (hex)',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(InitiativesUpdate)
      const client = getClient()

      const input: InitiativeUpdateInput = {}

      if (flags.name) input.name = flags.name
      if (flags.description) input.description = flags.description
      if (flags.status) {
        input.status = InitiativeStatus[flags.status as keyof typeof InitiativeStatus]
      }
      if (flags['target-date']) input.targetDate = flags['target-date']
      if (flags['owner-id']) input.ownerId = flags['owner-id']
      if (flags.icon) input.icon = flags.icon
      if (flags.color) input.color = flags.color

      if (Object.keys(input).length === 0) {
        throw new CliError(ErrorCodes.INVALID_INPUT, 'No update fields provided')
      }

      const payload = await client.updateInitiative(args.id, input)

      if (!payload.success) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to update initiative')
      }

      const initiative = await payload.initiative
      if (!initiative) {
        throw new CliError(ErrorCodes.API_ERROR, 'Initiative not returned')
      }

      print(
        success({
          id: initiative.id,
          name: initiative.name,
          status: initiative.status,
          updatedAt: initiative.updatedAt,
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
