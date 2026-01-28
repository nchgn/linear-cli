import {Command, Flags} from '@oclif/core'
import {getClient} from '../lib/client.js'
import {success, print, printItem} from '../lib/output.js'
import {handleError} from '../lib/errors.js'
import type {OutputFormat} from '../lib/types.js'

export default class Me extends Command {
  static override description = 'Show current user information'

  static override aliases = ['whoami']

  static override examples = ['<%= config.bin %> me', '<%= config.bin %> me --format table', '<%= config.bin %> whoami']

  static override flags = {
    format: Flags.string({
      char: 'F',
      description: 'Output format',
      options: ['json', 'table', 'plain'],
      default: 'json',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(Me)
      const format = flags.format as OutputFormat
      const client = getClient()

      const viewer = await client.viewer
      const [teams, organization] = await Promise.all([viewer.teams(), viewer.organization])

      const data = {
        id: viewer.id,
        name: viewer.name,
        email: viewer.email,
        displayName: viewer.displayName,
        active: viewer.active,
        admin: viewer.admin,
        timezone: viewer.timezone,
        createdAt: viewer.createdAt,
        organization: organization
          ? {
              id: organization.id,
              name: organization.name,
              urlKey: organization.urlKey,
            }
          : null,
        teams: teams.nodes.map((team) => ({
          id: team.id,
          key: team.key,
          name: team.name,
        })),
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            name: data.name,
            email: data.email,
            displayName: data.displayName,
            active: data.active ? 'Yes' : 'No',
            admin: data.admin ? 'Yes' : 'No',
            timezone: data.timezone,
            organization: data.organization?.name ?? 'N/A',
            teams: data.teams.map((t) => t.key).join(', '),
          } as Record<string, unknown>,
          format,
        )
      } else {
        // plain: just the email
        console.log(data.email)
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
