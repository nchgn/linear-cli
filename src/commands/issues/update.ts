import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {resolveIssueId} from '../../lib/issue-utils.js'
import type {LinearDocument} from '@linear/sdk'

type IssueUpdateInput = LinearDocument.IssueUpdateInput

export default class IssuesUpdate extends Command {
  static override description = 'Update an existing issue'

  static override examples = [
    '<%= config.bin %> issues update abc123 --input \'{"title":"Updated title"}\'',
    '<%= config.bin %> issues update ENG-123 --title "New title"',
    '<%= config.bin %> issues update ENG-123 --state-id xxx --assignee-id yyy',
  ]

  static override args = {
    id: Args.string({
      description: 'Issue ID or identifier (e.g., ENG-123)',
      required: true,
    }),
  }

  static override flags = {
    input: Flags.string({
      char: 'i',
      description: 'JSON input object (IssueUpdateInput)',
      exclusive: ['title', 'description', 'priority', 'assignee-id', 'state-id'],
    }),
    title: Flags.string({
      description: 'Issue title',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Issue description (markdown supported)',
    }),
    priority: Flags.integer({
      char: 'p',
      description: 'Priority (0=none, 1=urgent, 2=high, 3=medium, 4=low)',
    }),
    'assignee-id': Flags.string({
      description: 'Assignee user ID (use empty string to unassign)',
    }),
    'state-id': Flags.string({
      description: 'State ID',
    }),
    'project-id': Flags.string({
      description: 'Project ID',
    }),
    estimate: Flags.integer({
      description: 'Estimate points',
    }),
    'label-ids': Flags.string({
      description: 'Comma-separated label IDs (replaces existing labels)',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(IssuesUpdate)
      const client = getClient()

      const issueId = await resolveIssueId(client, args.id)

      let input: IssueUpdateInput

      if (flags.input) {
        // Parse JSON input
        try {
          input = JSON.parse(flags.input) as IssueUpdateInput
        } catch {
          throw new CliError(ErrorCodes.INVALID_INPUT, 'Invalid JSON in --input flag')
        }
      } else {
        // Build input from individual flags
        input = {}

        if (flags.title) input.title = flags.title
        if (flags.description) input.description = flags.description
        if (flags.priority !== undefined) input.priority = flags.priority
        if (flags['assignee-id'] !== undefined) {
          input.assigneeId = flags['assignee-id'] || null
        }
        if (flags['state-id']) input.stateId = flags['state-id']
        if (flags['project-id']) input.projectId = flags['project-id']
        if (flags.estimate !== undefined) input.estimate = flags.estimate
        if (flags['label-ids']) input.labelIds = flags['label-ids'].split(',')

        if (Object.keys(input).length === 0) {
          throw new CliError(ErrorCodes.INVALID_INPUT, 'No update fields provided. Use --input or individual flags.')
        }
      }

      // Update the issue
      const payload = await client.updateIssue(issueId, input)
      const issue = await payload.issue

      if (!issue) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to update issue')
      }

      print(
        success({
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          url: issue.url,
          updatedAt: issue.updatedAt,
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
