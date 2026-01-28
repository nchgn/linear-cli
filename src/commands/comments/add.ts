import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {resolveIssueId} from '../../lib/issue-utils.js'
import type {OutputFormat} from '../../lib/types.js'

export default class CommentsAdd extends Command {
  static override description = 'Add a comment to an issue'

  static override examples = [
    '<%= config.bin %> comments add ENG-123 --body "This is a comment"',
    '<%= config.bin %> comments add ENG-123 --body "Looks good!" --format table',
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
    body: Flags.string({
      char: 'b',
      description: 'Comment body (supports markdown)',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(CommentsAdd)
      const format = flags.format as OutputFormat
      const client = getClient()

      const issueId = await resolveIssueId(client, args.issue)
      const issue = await client.issue(issueId)

      if (!issue) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Issue ${args.issue} not found`)
      }

      const payload = await client.createComment({
        issueId,
        body: flags.body,
      })

      if (!payload.success || !payload.comment) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to create comment')
      }

      const comment = await payload.comment
      const user = await comment.user

      const data = {
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        user: user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
            }
          : null,
        issue: {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
        },
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            issue: data.issue.identifier,
            user: data.user?.name ?? 'Unknown',
            body: data.body,
            createdAt: data.createdAt,
          } as Record<string, unknown>,
          format,
        )
      } else {
        // plain: just the comment ID
        console.log(data.id)
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
