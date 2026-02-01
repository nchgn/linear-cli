import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class InitiativesGet extends Command {
  static override description = 'Get initiative details'

  static override examples = [
    '<%= config.bin %> initiatives get INITIATIVE_ID',
    '<%= config.bin %> initiatives get INITIATIVE_ID --format table',
  ]

  static override args = {
    id: Args.string({
      description: 'Initiative ID',
      required: true,
    }),
  }

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
      const {args, flags} = await this.parse(InitiativesGet)
      const format = flags.format as OutputFormat
      const client = getClient()

      const initiative = await client.initiative(args.id)

      if (!initiative) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Initiative ${args.id} not found`)
      }

      const [owner, creator, projects] = await Promise.all([
        initiative.owner,
        initiative.creator,
        initiative.projects(),
      ])

      const data = {
        id: initiative.id,
        name: initiative.name,
        description: initiative.description ?? null,
        status: initiative.status,
        icon: initiative.icon ?? null,
        color: initiative.color ?? null,
        owner: owner
          ? {
              id: owner.id,
              name: owner.name,
            }
          : null,
        creator: creator
          ? {
              id: creator.id,
              name: creator.name,
            }
          : null,
        targetDate: initiative.targetDate ?? null,
        projects: projects.nodes.map((p) => ({
          id: p.id,
          name: p.name,
        })),
        createdAt: initiative.createdAt,
        updatedAt: initiative.updatedAt,
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            name: data.name,
            status: data.status,
            owner: data.owner?.name ?? 'Unassigned',
            targetDate: data.targetDate ?? 'None',
            projects: data.projects.length,
            description: data.description ? `${data.description.slice(0, 100)}...` : 'None',
            createdAt: data.createdAt,
          } as Record<string, unknown>,
          format,
        )
      } else {
        console.log(data.id)
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
