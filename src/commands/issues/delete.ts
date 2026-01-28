import {Args, Command, Flags} from '@oclif/core';
import {getClient} from '../../lib/client.js';
import {success, print} from '../../lib/output.js';
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js';
import {resolveIssueId} from '../../lib/issue-utils.js';

export default class IssuesDelete extends Command {
  static override description = 'Delete an issue (moves to trash)';

  static override examples = [
    '<%= config.bin %> issues delete abc123',
    '<%= config.bin %> issues delete ENG-123',
    '<%= config.bin %> issues delete ENG-123 --permanent',
  ];

  static override args = {
    id: Args.string({
      description: 'Issue ID or identifier (e.g., ENG-123)',
      required: true,
    }),
  };

  static override flags = {
    permanent: Flags.boolean({
      description: 'Permanently delete (cannot be undone)',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(IssuesDelete);
      const client = getClient();

      const issueId = await resolveIssueId(client, args.id);

      // Get issue info before deletion
      const issue = await client.issue(issueId);
      if (!issue) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Issue ${args.id} not found`);
      }

      const identifier = issue.identifier;

      // Delete the issue
      if (flags.permanent) {
        // Archive first, then delete permanently
        await client.archiveIssue(issueId);
        await client.deleteIssue(issueId);
      } else {
        // Just archive (trash)
        await client.archiveIssue(issueId);
      }

      print(
        success({
          id: issueId,
          identifier,
          deleted: true,
          permanent: flags.permanent,
          message: flags.permanent
            ? `Issue ${identifier} permanently deleted`
            : `Issue ${identifier} moved to trash`,
        })
      );
    } catch (err) {
      handleError(err);
      this.exit(1);
    }
  }
}
