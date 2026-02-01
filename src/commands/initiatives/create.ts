import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {LinearDocument} from '@linear/sdk'

type InitiativeCreateInput = LinearDocument.InitiativeCreateInput
const InitiativeStatus = LinearDocument.InitiativeStatus

export default class InitiativesCreate extends Command {
  static override description = 'Create a new initiative'

  static override examples = [
    '<%= config.bin %> initiatives create --name "Q1 Goals"',
    '<%= config.bin %> initiatives create --name "Product Launch" --status Active',
    '<%= config.bin %> initiatives create --name "H2 Objectives" --target-date 2024-12-31',
  ]

  static override flags = {
    name: Flags.string({
      char: 'n',
      description: 'Initiative name',
      required: true,
    }),
    description: Flags.string({
      char: 'd',
      description: 'Initiative description',
    }),
    status: Flags.string({
      char: 's',
      description: 'Initiative status',
      options: ['Planned', 'Active', 'Completed'],
    }),
    'target-date': Flags.string({
      description: 'Target completion date (YYYY-MM-DD)',
    }),
    'owner-id': Flags.string({
      description: 'Owner user ID',
    }),
    icon: Flags.string({
      description: 'Initiative icon (emoji)',
    }),
    color: Flags.string({
      description: 'Initiative color (hex)',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(InitiativesCreate)
      const client = getClient()

      const input: InitiativeCreateInput = {
        name: flags.name,
      }

      if (flags.description) input.description = flags.description
      if (flags.status) {
        input.status = InitiativeStatus[flags.status as keyof typeof InitiativeStatus]
      }
      if (flags['target-date']) input.targetDate = flags['target-date']
      if (flags['owner-id']) input.ownerId = flags['owner-id']
      if (flags.icon) input.icon = flags.icon
      if (flags.color) input.color = flags.color

      const payload = await client.createInitiative(input)

      if (!payload.success) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to create initiative')
      }

      const initiative = await payload.initiative
      if (!initiative) {
        throw new CliError(ErrorCodes.API_ERROR, 'Initiative not returned')
      }

      const owner = await initiative.owner

      print(
        success({
          id: initiative.id,
          name: initiative.name,
          status: initiative.status,
          owner: owner ? {id: owner.id, name: owner.name} : null,
          createdAt: initiative.createdAt,
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
