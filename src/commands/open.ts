import {Args, Command, Flags} from '@oclif/core'
import open from 'open'
import {getClient} from '../lib/client.js'
import {success, print} from '../lib/output.js'
import {handleError} from '../lib/errors.js'
import {parseIdentifier, isUUID, resolveIssueId} from '../lib/issue-utils.js'

export default class Open extends Command {
  static override description = 'Open Linear resources in browser'

  static override examples = [
    '<%= config.bin %> open ENG-123',
    '<%= config.bin %> open --team ENG',
    '<%= config.bin %> open --inbox',
    '<%= config.bin %> open --settings',
    '<%= config.bin %> open --my-issues',
  ]

  static override args = {
    issue: Args.string({
      description: 'Issue identifier (e.g., ENG-123) or ID to open',
      required: false,
    }),
  }

  static override flags = {
    team: Flags.string({
      char: 't',
      description: 'Open team page by key (e.g., ENG)',
      exclusive: ['inbox', 'settings', 'my-issues'],
    }),
    inbox: Flags.boolean({
      description: 'Open inbox',
      exclusive: ['team', 'settings', 'my-issues'],
    }),
    settings: Flags.boolean({
      description: 'Open workspace settings',
      exclusive: ['team', 'inbox', 'my-issues'],
    }),
    'my-issues': Flags.boolean({
      description: 'Open my issues view',
      exclusive: ['team', 'inbox', 'settings'],
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(Open)
      const client = getClient()

      // Get organization for URL building
      const viewer = await client.viewer
      const organization = await viewer.organization

      if (!organization) {
        throw new Error('Could not determine organization')
      }

      const orgKey = organization.urlKey
      let url: string

      if (args.issue) {
        // Open specific issue
        const parsed = parseIdentifier(args.issue)
        if (parsed) {
          url = `https://linear.app/${orgKey}/issue/${args.issue}`
        } else if (isUUID(args.issue)) {
          // Need to fetch issue to get identifier for URL
          const issueId = await resolveIssueId(client, args.issue)
          const issue = await client.issue(issueId)
          url = issue.url
        } else {
          throw new Error(`Invalid issue identifier: ${args.issue}`)
        }
      } else if (flags.team) {
        // Open team page
        url = `https://linear.app/${orgKey}/team/${flags.team}`
      } else if (flags.inbox) {
        // Open inbox
        url = `https://linear.app/${orgKey}/inbox`
      } else if (flags.settings) {
        // Open settings
        url = `https://linear.app/${orgKey}/settings`
      } else if (flags['my-issues']) {
        // Open my issues
        url = `https://linear.app/${orgKey}/my-issues`
      } else {
        // Default: open workspace home
        url = `https://linear.app/${orgKey}`
      }

      await open(url)

      print(
        success({
          opened: true,
          url,
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
