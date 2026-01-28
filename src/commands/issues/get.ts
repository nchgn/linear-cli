import {Args, Command} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {resolveIssueId} from '../../lib/issue-utils.js'

export default class IssuesGet extends Command {
  static override description = 'Get a single issue by ID or identifier'

  static override examples = ['<%= config.bin %> issues get abc123', '<%= config.bin %> issues get ENG-123']

  static override args = {
    id: Args.string({
      description: 'Issue ID or identifier (e.g., ENG-123)',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args} = await this.parse(IssuesGet)
      const client = getClient()

      const issueId = await resolveIssueId(client, args.id)
      const issue = await client.issue(issueId)

      if (!issue) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Issue ${args.id} not found`)
      }

      // Fetch related data
      const [state, assignee, team, labels, comments] = await Promise.all([
        issue.state,
        issue.assignee,
        issue.team,
        issue.labels(),
        issue.comments(),
      ])

      print(
        success({
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          description: issue.description,
          priority: issue.priority,
          priorityLabel: issue.priorityLabel,
          estimate: issue.estimate,
          url: issue.url,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
          state: state
            ? {
                id: state.id,
                name: state.name,
                color: state.color,
                type: state.type,
              }
            : null,
          assignee: assignee
            ? {
                id: assignee.id,
                name: assignee.name,
                email: assignee.email,
              }
            : null,
          team: team
            ? {
                id: team.id,
                key: team.key,
                name: team.name,
              }
            : null,
          labels: labels.nodes.map((label) => ({
            id: label.id,
            name: label.name,
            color: label.color,
          })),
          commentsCount: comments.nodes.length,
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
