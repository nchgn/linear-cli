import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {successList, print, printList} from '../../lib/output.js'
import {handleError} from '../../lib/errors.js'
import {colors, type ColumnDef} from '../../lib/formatter.js'
import type {OutputFormat} from '../../lib/types.js'

interface StateData {
  id: string
  name: string
  color: string
  type: string
  position: number
  teamId: string
  teamKey: string
}

const STATE_TYPE_ORDER: Record<string, number> = {
  backlog: 1,
  unstarted: 2,
  started: 3,
  completed: 4,
  canceled: 5,
}

const formatStateType = (type: string): string => {
  switch (type) {
    case 'backlog':
      return colors.gray('backlog')
    case 'unstarted':
      return colors.blue('unstarted')
    case 'started':
      return colors.yellow('started')
    case 'completed':
      return colors.green('completed')
    case 'canceled':
      return colors.red('canceled')
    default:
      return type
  }
}

const COLUMNS: ColumnDef<StateData>[] = [
  {
    key: 'teamKey',
    header: 'TEAM',
    format: (value) => colors.cyan(String(value)),
  },
  {
    key: 'name',
    header: 'NAME',
    format: (value) => colors.bold(String(value)),
  },
  {
    key: 'type',
    header: 'TYPE',
    format: (value) => formatStateType(String(value)),
  },
  {
    key: 'color',
    header: 'COLOR',
    format: (value) => colors.dim(String(value)),
  },
]

export default class StatesList extends Command {
  static override description = 'List workflow states in the workspace'

  static override examples = [
    '<%= config.bin %> states list',
    '<%= config.bin %> states list --format table',
    '<%= config.bin %> states list --team ENG',
  ]

  static override flags = {
    format: Flags.string({
      char: 'F',
      description: 'Output format',
      options: ['json', 'table', 'plain'],
      default: 'json',
    }),
    team: Flags.string({
      char: 't',
      description: 'Filter by team key (e.g., ENG)',
    }),
    first: Flags.integer({
      description: 'Number of states to fetch (default: 100)',
      default: 100,
    }),
    after: Flags.string({
      description: 'Cursor for pagination',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(StatesList)
      const format = flags.format as OutputFormat
      const client = getClient()

      let states

      if (flags.team) {
        // Fetch states for a specific team
        const teams = await client.teams({
          filter: {key: {eq: flags.team}},
        })
        const team = teams.nodes[0]
        if (!team) {
          throw new Error(`Team ${flags.team} not found`)
        }
        states = await team.states({
          first: flags.first,
          after: flags.after,
        })
      } else {
        // Fetch all workflow states
        states = await client.workflowStates({
          first: flags.first,
          after: flags.after,
        })
      }

      const data: StateData[] = await Promise.all(
        states.nodes.map(async (state) => {
          const team = await state.team
          return {
            id: state.id,
            name: state.name,
            color: state.color,
            type: state.type,
            position: state.position,
            teamId: team?.id ?? '',
            teamKey: team?.key ?? '',
          }
        }),
      )

      // Sort by team, then by type order, then by position
      data.sort((a, b) => {
        if (a.teamKey !== b.teamKey) {
          return a.teamKey.localeCompare(b.teamKey)
        }
        const typeOrderA = STATE_TYPE_ORDER[a.type] ?? 99
        const typeOrderB = STATE_TYPE_ORDER[b.type] ?? 99
        if (typeOrderA !== typeOrderB) {
          return typeOrderA - typeOrderB
        }
        return a.position - b.position
      })

      const pageInfo = {
        hasNextPage: states.pageInfo.hasNextPage,
        hasPreviousPage: states.pageInfo.hasPreviousPage,
        startCursor: states.pageInfo.startCursor,
        endCursor: states.pageInfo.endCursor,
      }

      if (format === 'json') {
        print(successList(data, pageInfo))
      } else {
        printList(data, format, {
          columns: COLUMNS,
          primaryKey: 'name',
          secondaryKey: 'type',
          pageInfo,
        })
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
