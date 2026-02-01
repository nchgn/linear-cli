import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {successList, print, printList} from '../../lib/output.js'
import {handleError} from '../../lib/errors.js'
import {colors, truncate, formatProgress, type ColumnDef} from '../../lib/formatter.js'
import type {OutputFormat} from '../../lib/types.js'

interface InitiativeData {
  id: string
  name: string
  status: string
  owner: {id: string; name: string} | null
  targetDate: string | null
  projectCount: number
  progress: string
  createdAt: Date
}

const COLUMNS: ColumnDef<InitiativeData>[] = [
  {
    key: 'id',
    header: 'ID',
    format: (value) => colors.dim(truncate(String(value), 12)),
  },
  {
    key: 'name',
    header: 'NAME',
    format: (value) => colors.bold(truncate(String(value), 30)),
  },
  {
    key: 'status',
    header: 'STATUS',
    format: (value) => {
      const status = String(value)
      if (status === 'Active') return colors.green(status)
      if (status === 'Completed') return colors.cyan(status)
      return colors.gray(status)
    },
  },
  {
    key: 'owner',
    header: 'OWNER',
    format: (_value, row) => {
      const owner = row.owner
      return owner ? truncate(owner.name, 15) : colors.gray('Unassigned')
    },
  },
  {
    key: 'targetDate',
    header: 'TARGET',
    format: (value) => (value ? colors.dim(String(value)) : colors.gray('None')),
  },
  {
    key: 'projectCount',
    header: 'PROJECTS',
    format: (value) => String(value),
  },
  {
    key: 'progress',
    header: 'PROGRESS',
    format: (value) => String(value),
  },
]

export default class InitiativesList extends Command {
  static override description = 'List initiatives'

  static override examples = [
    '<%= config.bin %> initiatives list',
    '<%= config.bin %> initiatives list --status Active',
    '<%= config.bin %> initiatives list --format table',
  ]

  static override flags = {
    format: Flags.string({
      char: 'F',
      description: 'Output format',
      options: ['json', 'table', 'plain'],
      default: 'json',
    }),
    status: Flags.string({
      char: 's',
      description: 'Filter by status (Planned, Active, Completed)',
      options: ['Planned', 'Active', 'Completed'],
    }),
    first: Flags.integer({
      description: 'Number of initiatives to fetch',
      default: 50,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(InitiativesList)
      const format = flags.format as OutputFormat
      const client = getClient()

      const initiatives = await client.initiatives({
        first: flags.first,
      })

      // Client-side filtering since the API doesn't support filter
      let filtered = initiatives.nodes
      if (flags.status) {
        filtered = filtered.filter((i) => i.status === flags.status)
      }

      const data: InitiativeData[] = await Promise.all(
        filtered.map(async (initiative) => {
          const owner = await initiative.owner
          const projects = await initiative.projects()

          // Calculate progress from projects
          let totalProgress = 0
          if (projects.nodes.length > 0) {
            for (const project of projects.nodes) {
              totalProgress += project.progress
            }
            totalProgress = totalProgress / projects.nodes.length
          }

          return {
            id: initiative.id,
            name: initiative.name,
            status: initiative.status,
            owner: owner ? {id: owner.id, name: owner.name} : null,
            targetDate: initiative.targetDate ?? null,
            projectCount: projects.nodes.length,
            progress: formatProgress(totalProgress),
            createdAt: initiative.createdAt,
          }
        }),
      )

      const pageInfo = {
        hasNextPage: initiatives.pageInfo.hasNextPage,
        hasPreviousPage: initiatives.pageInfo.hasPreviousPage,
        startCursor: initiatives.pageInfo.startCursor,
        endCursor: initiatives.pageInfo.endCursor,
      }

      if (format === 'json') {
        print(successList(data, pageInfo))
      } else {
        printList(data, format, {
          columns: COLUMNS,
          primaryKey: 'name',
          secondaryKey: 'id',
          pageInfo,
        })
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
