import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {successList, print, printList} from '../../lib/output.js'
import {handleError} from '../../lib/errors.js'
import {colors, truncate, type ColumnDef} from '../../lib/formatter.js'
import type {OutputFormat} from '../../lib/types.js'

interface LabelData {
  id: string
  name: string
  color: string
  description: string | undefined
  isGroup: boolean
  parentId: string | undefined
  createdAt: Date
}

const COLUMNS: ColumnDef<LabelData>[] = [
  {
    key: 'name',
    header: 'NAME',
    format: (value, row) => {
      const name = String(value)
      if (row.isGroup) {
        return colors.bold(name) + colors.dim(' (group)')
      }
      return colors.bold(name)
    },
  },
  {
    key: 'color',
    header: 'COLOR',
    format: (value) => colors.dim(String(value)),
  },
  {
    key: 'description',
    header: 'DESCRIPTION',
    format: (value) => truncate(String(value ?? ''), 40),
  },
]

export default class LabelsList extends Command {
  static override description = 'List labels in the workspace'

  static override examples = [
    '<%= config.bin %> labels list',
    '<%= config.bin %> labels list --format table',
    '<%= config.bin %> labels list --team ENG',
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
      description: 'Number of labels to fetch (default: 100)',
      default: 100,
    }),
    after: Flags.string({
      description: 'Cursor for pagination',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(LabelsList)
      const format = flags.format as OutputFormat
      const client = getClient()

      let labels

      if (flags.team) {
        // Fetch labels for a specific team
        const teams = await client.teams({
          filter: {key: {eq: flags.team}},
        })
        const team = teams.nodes[0]
        if (!team) {
          throw new Error(`Team ${flags.team} not found`)
        }
        labels = await team.labels({
          first: flags.first,
          after: flags.after,
        })
      } else {
        // Fetch all workspace labels (issueLabels returns workspace labels)
        labels = await client.issueLabels({
          first: flags.first,
          after: flags.after,
        })
      }

      const data: LabelData[] = await Promise.all(
        labels.nodes.map(async (label) => {
          const parent = await label.parent
          return {
            id: label.id,
            name: label.name,
            color: label.color,
            description: label.description ?? undefined,
            isGroup: label.isGroup,
            parentId: parent?.id,
            createdAt: label.createdAt,
          }
        }),
      )

      const pageInfo = {
        hasNextPage: labels.pageInfo.hasNextPage,
        hasPreviousPage: labels.pageInfo.hasPreviousPage,
        startCursor: labels.pageInfo.startCursor,
        endCursor: labels.pageInfo.endCursor,
      }

      if (format === 'json') {
        print(successList(data, pageInfo))
      } else {
        printList(data, format, {
          columns: COLUMNS,
          primaryKey: 'name',
          secondaryKey: 'description',
          pageInfo,
        })
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
