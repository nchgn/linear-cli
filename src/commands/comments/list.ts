import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {successList, print, printList} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {resolveIssueId} from '../../lib/issue-utils.js'
import {colors, truncate, type ColumnDef} from '../../lib/formatter.js'
import type {OutputFormat} from '../../lib/types.js'

interface CommentData {
  id: string
  body: string
  createdAt: Date
  updatedAt: Date
  userId: string
  userName: string
  userEmail: string
}

const COLUMNS: ColumnDef<CommentData>[] = [
  {
    key: 'userName',
    header: 'USER',
    format: (value) => colors.cyan(String(value)),
  },
  {
    key: 'body',
    header: 'COMMENT',
    format: (value) => truncate(String(value).replace(/\n/g, ' '), 60),
  },
  {
    key: 'createdAt',
    header: 'DATE',
    format: (value) => {
      const date = new Date(value as string)
      return colors.dim(date.toLocaleDateString())
    },
  },
]

export default class CommentsList extends Command {
  static override description = 'List comments on an issue'

  static override examples = [
    '<%= config.bin %> comments list ENG-123',
    '<%= config.bin %> comments list ENG-123 --format table',
  ]

  static override args = {
    issue: Args.string({
      description: 'Issue ID or identifier (e.g., ENG-123)',
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
    first: Flags.integer({
      description: 'Number of comments to fetch (default: 50)',
      default: 50,
    }),
    after: Flags.string({
      description: 'Cursor for pagination',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(CommentsList)
      const format = flags.format as OutputFormat
      const client = getClient()

      const issueId = await resolveIssueId(client, args.issue)
      const issue = await client.issue(issueId)

      if (!issue) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Issue ${args.issue} not found`)
      }

      const comments = await issue.comments({
        first: flags.first,
        after: flags.after,
      })

      const data: CommentData[] = await Promise.all(
        comments.nodes.map(async (comment) => {
          const user = await comment.user
          return {
            id: comment.id,
            body: comment.body,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            userId: user?.id ?? '',
            userName: user?.name ?? 'Unknown',
            userEmail: user?.email ?? '',
          }
        }),
      )

      const pageInfo = {
        hasNextPage: comments.pageInfo.hasNextPage,
        hasPreviousPage: comments.pageInfo.hasPreviousPage,
        startCursor: comments.pageInfo.startCursor,
        endCursor: comments.pageInfo.endCursor,
      }

      if (format === 'json') {
        print(successList(data, pageInfo))
      } else {
        printList(data, format, {
          columns: COLUMNS,
          primaryKey: 'userName',
          secondaryKey: 'body',
          pageInfo,
        })
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
