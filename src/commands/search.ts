import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../lib/client.js'
import {successList, print, printList} from '../lib/output.js'
import {handleError} from '../lib/errors.js'
import {colors, truncate, formatPriority, type ColumnDef} from '../lib/formatter.js'
import type {OutputFormat} from '../lib/types.js'

interface SearchResultData {
  id: string
  identifier: string
  title: string
  description: string | undefined
  priority: number
  priorityLabel: string
  url: string
  createdAt: Date
  updatedAt: Date
}

const COLUMNS: ColumnDef<SearchResultData>[] = [
  {
    key: 'identifier',
    header: 'ID',
    format: (value) => colors.cyan(String(value)),
  },
  {
    key: 'priority',
    header: 'PRI',
    format: (value) => formatPriority(Number(value)),
  },
  {
    key: 'title',
    header: 'TITLE',
    format: (value) => truncate(String(value), 50),
  },
]

export default class Search extends Command {
  static override description = 'Search issues by text query'

  static override examples = [
    '<%= config.bin %> search "bug login"',
    '<%= config.bin %> search "SSO" --team ENG',
    '<%= config.bin %> search "authentication" --format table',
  ]

  static override args = {
    query: Args.string({
      description: 'Search query',
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
    team: Flags.string({
      char: 't',
      description: 'Filter by team key (e.g., ENG)',
    }),
    first: Flags.integer({
      description: 'Number of results to fetch (default: 20)',
      default: 20,
    }),
    after: Flags.string({
      description: 'Cursor for pagination',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(Search)
      const format = flags.format as OutputFormat
      const client = getClient()

      // Build filter for team if specified
      const filter = flags.team ? {team: {key: {eq: flags.team}}} : undefined

      // Use the searchIssues method for text search
      const searchResults = await client.searchIssues(args.query, {
        filter,
        first: flags.first,
        after: flags.after,
      })

      const data: SearchResultData[] = searchResults.nodes.map((issue) => ({
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        description: issue.description ?? undefined,
        priority: issue.priority,
        priorityLabel: issue.priorityLabel,
        url: issue.url,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
      }))

      const pageInfo = {
        hasNextPage: searchResults.pageInfo.hasNextPage,
        hasPreviousPage: searchResults.pageInfo.hasPreviousPage,
        startCursor: searchResults.pageInfo.startCursor,
        endCursor: searchResults.pageInfo.endCursor,
      }

      if (format === 'json') {
        print(successList(data, pageInfo))
      } else {
        printList(data, format, {
          columns: COLUMNS,
          primaryKey: 'identifier',
          secondaryKey: 'title',
          pageInfo,
        })
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
