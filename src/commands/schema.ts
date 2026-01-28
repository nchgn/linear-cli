import {Args, Command, Flags} from '@oclif/core';
import {success, print} from '../lib/output.js';

/**
 * Schema definitions for all supported entities.
 * This enables LLMs to discover available operations and construct valid queries.
 */
const ENTITY_SCHEMAS = {
  issues: {
    entity: 'issues',
    operations: ['list', 'get', 'create', 'update', 'delete'],
    description: 'Work items in Linear (bugs, features, tasks)',
    fields: {
      id: {type: 'ID!', description: 'Unique identifier'},
      identifier: {type: 'String!', description: 'Human-readable identifier (e.g., ENG-123)'},
      title: {type: 'String!', description: 'Issue title'},
      description: {type: 'String', description: 'Issue description in markdown'},
      priority: {type: 'Int!', description: 'Priority (0=none, 1=urgent, 2=high, 3=medium, 4=low)'},
      priorityLabel: {type: 'String!', description: 'Priority label text'},
      estimate: {type: 'Float', description: 'Story points estimate'},
      url: {type: 'String!', description: 'Linear URL'},
      createdAt: {type: 'DateTime!', description: 'Creation timestamp'},
      updatedAt: {type: 'DateTime!', description: 'Last update timestamp'},
    },
    filters: {
      team: {type: 'TeamFilter', description: 'Filter by team'},
      assignee: {type: 'UserFilter', description: 'Filter by assignee'},
      state: {type: 'WorkflowStateFilter', description: 'Filter by state'},
      project: {type: 'ProjectFilter', description: 'Filter by project'},
      priority: {type: 'IntComparator', description: 'Filter by priority'},
      estimate: {type: 'EstimateComparator', description: 'Filter by estimate'},
      labels: {type: 'IssueLabelFilter', description: 'Filter by labels'},
      createdAt: {type: 'DateComparator', description: 'Filter by creation date'},
      updatedAt: {type: 'DateComparator', description: 'Filter by update date'},
    },
    createInput: {
      title: {type: 'String!', required: true, description: 'Issue title'},
      teamId: {type: 'ID!', required: true, description: 'Team ID'},
      description: {type: 'String', description: 'Issue description in markdown'},
      priority: {type: 'Int', description: 'Priority (0-4)'},
      assigneeId: {type: 'ID', description: 'Assignee user ID'},
      stateId: {type: 'ID', description: 'Workflow state ID'},
      projectId: {type: 'ID', description: 'Project ID'},
      estimate: {type: 'Float', description: 'Story points estimate'},
      labelIds: {type: '[ID!]', description: 'Array of label IDs'},
    },
    examples: {
      list: 'linear issues list --team ENG --state "In Progress"',
      get: 'linear issues get ENG-123',
      create: 'linear issues create --title "Fix bug" --team-id xxx',
      update: 'linear issues update ENG-123 --state-id yyy',
      delete: 'linear issues delete ENG-123',
    },
  },
  projects: {
    entity: 'projects',
    operations: ['list', 'get'],
    description: 'Projects group related issues together',
    fields: {
      id: {type: 'ID!', description: 'Unique identifier'},
      name: {type: 'String!', description: 'Project name'},
      description: {type: 'String', description: 'Project description'},
      state: {type: 'String!', description: 'Project state'},
      url: {type: 'String!', description: 'Linear URL'},
      startDate: {type: 'Date', description: 'Project start date'},
      targetDate: {type: 'Date', description: 'Project target date'},
    },
    filters: {
      name: {type: 'StringComparator', description: 'Filter by name'},
      state: {type: 'StringComparator', description: 'Filter by state'},
    },
  },
  teams: {
    entity: 'teams',
    operations: ['list', 'get'],
    description: 'Teams organize members and issues',
    fields: {
      id: {type: 'ID!', description: 'Unique identifier'},
      key: {type: 'String!', description: 'Team key (e.g., ENG)'},
      name: {type: 'String!', description: 'Team name'},
      description: {type: 'String', description: 'Team description'},
    },
  },
  users: {
    entity: 'users',
    operations: ['list', 'get', 'me'],
    description: 'Users in the Linear workspace',
    fields: {
      id: {type: 'ID!', description: 'Unique identifier'},
      name: {type: 'String!', description: 'User name'},
      email: {type: 'String!', description: 'User email'},
      displayName: {type: 'String!', description: 'Display name'},
      active: {type: 'Boolean!', description: 'Whether user is active'},
    },
  },
  cycles: {
    entity: 'cycles',
    operations: ['list', 'get'],
    description: 'Time-boxed iterations (sprints)',
    fields: {
      id: {type: 'ID!', description: 'Unique identifier'},
      name: {type: 'String', description: 'Cycle name'},
      number: {type: 'Int!', description: 'Cycle number'},
      startsAt: {type: 'DateTime!', description: 'Cycle start date'},
      endsAt: {type: 'DateTime!', description: 'Cycle end date'},
    },
  },
  labels: {
    entity: 'labels',
    operations: ['list', 'get'],
    description: 'Labels for categorizing issues',
    fields: {
      id: {type: 'ID!', description: 'Unique identifier'},
      name: {type: 'String!', description: 'Label name'},
      color: {type: 'String!', description: 'Label color'},
      description: {type: 'String', description: 'Label description'},
    },
  },
  comments: {
    entity: 'comments',
    operations: ['list', 'get', 'create'],
    description: 'Comments on issues',
    fields: {
      id: {type: 'ID!', description: 'Unique identifier'},
      body: {type: 'String!', description: 'Comment body in markdown'},
      createdAt: {type: 'DateTime!', description: 'Creation timestamp'},
    },
    createInput: {
      body: {type: 'String!', required: true, description: 'Comment body in markdown'},
      issueId: {type: 'ID!', required: true, description: 'Issue ID to comment on'},
    },
  },
} as const;

type EntityName = keyof typeof ENTITY_SCHEMAS;

export default class Schema extends Command {
  static override description =
    'Show schema information for entities (useful for LLMs to discover available operations)';

  static override examples = [
    '<%= config.bin %> schema',
    '<%= config.bin %> schema issues',
    '<%= config.bin %> schema --full',
    '<%= config.bin %> schema issues --include-examples',
  ];

  static override args = {
    entity: Args.string({
      description: 'Entity name (issues, projects, teams, users, cycles, labels, comments)',
      required: false,
    }),
  };

  static override flags = {
    full: Flags.boolean({
      description: 'Show full schema for all entities',
      default: false,
    }),
    'include-examples': Flags.boolean({
      description: 'Include usage examples',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Schema);

    if (flags.full) {
      // Return all schemas
      print(
        success({
          entities: Object.keys(ENTITY_SCHEMAS),
          schemas: ENTITY_SCHEMAS,
          note: 'Use "linear query" for raw GraphQL queries',
        })
      );
      return;
    }

    if (args.entity) {
      // Return specific entity schema
      const entityName = args.entity.toLowerCase() as EntityName;
      const schema = ENTITY_SCHEMAS[entityName];

      if (!schema) {
        print(
          success({
            error: `Unknown entity: ${args.entity}`,
            availableEntities: Object.keys(ENTITY_SCHEMAS),
          })
        );
        return;
      }

      const result: Record<string, unknown> = {...schema};

      if (!flags['include-examples'] && 'examples' in result) {
        delete result.examples;
      }

      print(success(result));
      return;
    }

    // Return list of available entities with basic info
    const entities = Object.entries(ENTITY_SCHEMAS).map(([name, schema]) => ({
      name,
      description: schema.description,
      operations: schema.operations,
    }));

    print(
      success({
        entities,
        usage: 'Use "linear schema <entity>" for detailed schema',
        fullSchema: 'Use "linear schema --full" for complete schema',
      })
    );
  }
}
