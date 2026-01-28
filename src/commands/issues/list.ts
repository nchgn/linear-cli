import {Command, Flags} from '@oclif/core';
import {getClient} from '../../lib/client.js';
import {successList, print} from '../../lib/output.js';
import {handleError} from '../../lib/errors.js';
import type {LinearDocument} from '@linear/sdk';

type IssueFilter = LinearDocument.IssueFilter;

export default class IssuesList extends Command {
  static override description = 'List issues with optional filtering';

  static override examples = [
    '<%= config.bin %> issues list',
    '<%= config.bin %> issues list --team ENG',
    '<%= config.bin %> issues list --assignee me',
    '<%= config.bin %> issues list --filter \'{"state":{"name":{"eq":"In Progress"}}}\'',
    '<%= config.bin %> issues list --first 50 --after cursor123',
  ];

  static override flags = {
    team: Flags.string({
      char: 't',
      description: 'Filter by team key (e.g., ENG)',
    }),
    assignee: Flags.string({
      char: 'a',
      description: 'Filter by assignee (use "me" for current user)',
    }),
    state: Flags.string({
      char: 's',
      description: 'Filter by state name (e.g., "In Progress")',
    }),
    filter: Flags.string({
      char: 'f',
      description: 'JSON filter object (IssueFilter from Linear SDK)',
    }),
    first: Flags.integer({
      description: 'Number of issues to fetch (default: 50)',
      default: 50,
    }),
    after: Flags.string({
      description: 'Cursor for pagination',
    }),
  };

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(IssuesList);
      const client = getClient();

      // Build filter
      let filter: IssueFilter = {};

      // Parse JSON filter if provided
      if (flags.filter) {
        try {
          filter = JSON.parse(flags.filter) as IssueFilter;
        } catch {
          throw new Error('Invalid JSON in --filter flag');
        }
      }

      // Apply shorthand filters
      if (flags.team) {
        filter.team = {key: {eq: flags.team}};
      }

      if (flags.assignee) {
        if (flags.assignee === 'me') {
          const viewer = await client.viewer;
          filter.assignee = {id: {eq: viewer.id}};
        } else {
          filter.assignee = {id: {eq: flags.assignee}};
        }
      }

      if (flags.state) {
        filter.state = {name: {eq: flags.state}};
      }

      // Fetch issues
      const issues = await client.issues({
        filter,
        first: flags.first,
        after: flags.after,
      });

      // Map to clean objects
      const data = issues.nodes.map((issue) => ({
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
      }));

      print(
        successList(data, {
          hasNextPage: issues.pageInfo.hasNextPage,
          hasPreviousPage: issues.pageInfo.hasPreviousPage,
          startCursor: issues.pageInfo.startCursor,
          endCursor: issues.pageInfo.endCursor,
        })
      );
    } catch (err) {
      handleError(err);
      this.exit(1);
    }
  }
}
