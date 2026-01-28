import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {successList, print, printList} from '../../lib/output.js'
import {handleError} from '../../lib/errors.js'
import {colors, truncate, type ColumnDef} from '../../lib/formatter.js'
import type {OutputFormat} from '../../lib/types.js'

interface ProjectData {
  id: string
  name: string
  description: string | undefined
  state: string
  progress: number
  targetDate: string | undefined
  url: string
  createdAt: Date
  updatedAt: Date
}

const formatProgress = (progress: number): string => {
  const percentage = Math.round(progress * 100)
  if (percentage === 100) {
    return colors.green(`${percentage}%`)
  }
  if (percentage >= 75) {
    return colors.cyan(`${percentage}%`)
  }
  if (percentage >= 50) {
    return colors.yellow(`${percentage}%`)
  }
  return colors.dim(`${percentage}%`)
}

const formatState = (state: string): string => {
  switch (state) {
    case 'planned':
      return colors.blue('planned')
    case 'started':
      return colors.yellow('started')
    case 'paused':
      return colors.gray('paused')
    case 'completed':
      return colors.green('completed')
    case 'canceled':
      return colors.red('canceled')
    default:
      return state
  }
}

const COLUMNS: ColumnDef<ProjectData>[] = [
  {
    key: 'name',
    header: 'NAME',
    format: (value) => colors.bold(truncate(String(value), 30)),
  },
  {
    key: 'state',
    header: 'STATE',
    format: (value) => formatState(String(value)),
  },
  {
    key: 'progress',
    header: 'PROGRESS',
    format: (value) => formatProgress(Number(value)),
  },
  {
    key: 'targetDate',
    header: 'TARGET',
    format: (value) => (value ? colors.dim(String(value)) : colors.gray('No date')),
  },
]

export default class ProjectsList extends Command {
  static override description = 'List projects in the workspace'

  static override examples = [
    '<%= config.bin %> projects list',
    '<%= config.bin %> projects list --format table',
    '<%= config.bin %> projects list --team ENG',
    '<%= config.bin %> projects list --state started',
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
    state: Flags.string({
      char: 's',
      description: 'Filter by state (planned, started, paused, completed, canceled)',
    }),
    first: Flags.integer({
      description: 'Number of projects to fetch (default: 50)',
      default: 50,
    }),
    after: Flags.string({
      description: 'Cursor for pagination',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(ProjectsList)
      const format = flags.format as OutputFormat
      const client = getClient()

      // Build filter
      const filter: Record<string, unknown> = {}

      if (flags.state) {
        filter.state = {eq: flags.state}
      }

      if (flags.team) {
        // Filter projects by team
        filter.accessibleTeams = {key: {eq: flags.team}}
      }

      const projects = await client.projects({
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        first: flags.first,
        after: flags.after,
      })

      const data: ProjectData[] = projects.nodes.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description ?? undefined,
        state: project.state,
        progress: project.progress,
        targetDate: project.targetDate ?? undefined,
        url: project.url,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }))

      const pageInfo = {
        hasNextPage: projects.pageInfo.hasNextPage,
        hasPreviousPage: projects.pageInfo.hasPreviousPage,
        startCursor: projects.pageInfo.startCursor,
        endCursor: projects.pageInfo.endCursor,
      }

      if (format === 'json') {
        print(successList(data, pageInfo))
      } else {
        printList(data, format, {
          columns: COLUMNS,
          primaryKey: 'name',
          secondaryKey: 'state',
          pageInfo,
        })
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
