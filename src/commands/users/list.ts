import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {successList, print, printList} from '../../lib/output.js'
import {handleError} from '../../lib/errors.js'
import {colors, type ColumnDef} from '../../lib/formatter.js'
import type {OutputFormat} from '../../lib/types.js'

interface UserData {
  id: string
  name: string
  displayName: string
  email: string
  active: boolean
  admin: boolean
  guest: boolean
  avatarUrl: string | undefined
  createdAt: Date
}

const COLUMNS: ColumnDef<UserData>[] = [
  {
    key: 'name',
    header: 'NAME',
    format: (value) => colors.bold(String(value)),
  },
  {
    key: 'email',
    header: 'EMAIL',
    format: (value) => colors.dim(String(value)),
  },
  {
    key: 'active',
    header: 'ACTIVE',
    format: (value) => (value ? colors.green('Yes') : colors.red('No')),
  },
  {
    key: 'admin',
    header: 'ADMIN',
    format: (value) => (value ? colors.yellow('Yes') : colors.gray('No')),
  },
]

export default class UsersList extends Command {
  static override description = 'List users in the workspace'

  static override examples = [
    '<%= config.bin %> users list',
    '<%= config.bin %> users list --format table',
    '<%= config.bin %> users list --active',
  ]

  static override flags = {
    format: Flags.string({
      char: 'F',
      description: 'Output format',
      options: ['json', 'table', 'plain'],
      default: 'json',
    }),
    active: Flags.boolean({
      description: 'Show only active users',
      default: false,
    }),
    first: Flags.integer({
      description: 'Number of users to fetch (default: 100)',
      default: 100,
    }),
    after: Flags.string({
      description: 'Cursor for pagination',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(UsersList)
      const format = flags.format as OutputFormat
      const client = getClient()

      const filter = flags.active ? {active: {eq: true}} : undefined

      const users = await client.users({
        filter,
        first: flags.first,
        after: flags.after,
      })

      const data: UserData[] = users.nodes.map((user) => ({
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        active: user.active,
        admin: user.admin,
        guest: user.guest,
        avatarUrl: user.avatarUrl ?? undefined,
        createdAt: user.createdAt,
      }))

      const pageInfo = {
        hasNextPage: users.pageInfo.hasNextPage,
        hasPreviousPage: users.pageInfo.hasPreviousPage,
        startCursor: users.pageInfo.startCursor,
        endCursor: users.pageInfo.endCursor,
      }

      if (format === 'json') {
        print(successList(data, pageInfo))
      } else {
        printList(data, format, {
          columns: COLUMNS,
          primaryKey: 'name',
          secondaryKey: 'email',
          pageInfo,
        })
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
