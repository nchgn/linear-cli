import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {successList, print, printList} from '../../lib/output.js'
import {handleError} from '../../lib/errors.js'
import {colors, truncate, type ColumnDef} from '../../lib/formatter.js'
import type {OutputFormat} from '../../lib/types.js'

interface DocumentData {
  id: string
  title: string
  icon: string | null
  color: string | null
  projectId: string | null
  projectName: string | null
  creatorId: string | null
  creatorName: string | null
  createdAt: Date
  updatedAt: Date
}

const COLUMNS: ColumnDef<DocumentData>[] = [
  {
    key: 'title',
    header: 'TITLE',
    format: (value) => colors.bold(truncate(String(value), 40)),
  },
  {
    key: 'projectName',
    header: 'PROJECT',
    format: (value) => (value ? colors.cyan(truncate(String(value), 20)) : colors.gray('None')),
  },
  {
    key: 'creatorName',
    header: 'CREATOR',
    format: (value) => (value ? colors.dim(String(value)) : colors.gray('Unknown')),
  },
  {
    key: 'updatedAt',
    header: 'UPDATED',
    format: (value) => colors.dim(new Date(value as Date).toISOString().split('T')[0]),
  },
]

export default class DocumentsList extends Command {
  static override description = 'List documents'

  static override examples = [
    '<%= config.bin %> documents list',
    '<%= config.bin %> documents list --project-id PROJECT_ID',
    '<%= config.bin %> documents list --format table',
  ]

  static override flags = {
    format: Flags.string({
      char: 'F',
      description: 'Output format',
      options: ['json', 'table', 'plain'],
      default: 'json',
    }),
    'project-id': Flags.string({
      description: 'Filter by project ID',
    }),
    first: Flags.integer({
      description: 'Number of documents to fetch (default: 50)',
      default: 50,
    }),
    after: Flags.string({
      description: 'Cursor for pagination',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(DocumentsList)
      const format = flags.format as OutputFormat
      const client = getClient()

      const filter: Record<string, unknown> = {}
      if (flags['project-id']) {
        filter.project = {id: {eq: flags['project-id']}}
      }

      const documents = await client.documents({
        first: flags.first,
        after: flags.after,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
      })

      const data: DocumentData[] = await Promise.all(
        documents.nodes.map(async (doc) => {
          const [project, creator] = await Promise.all([doc.project, doc.creator])
          return {
            id: doc.id,
            title: doc.title,
            icon: doc.icon ?? null,
            color: doc.color ?? null,
            projectId: project?.id ?? null,
            projectName: project?.name ?? null,
            creatorId: creator?.id ?? null,
            creatorName: creator?.name ?? null,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          }
        }),
      )

      const pageInfo = {
        hasNextPage: documents.pageInfo.hasNextPage,
        hasPreviousPage: documents.pageInfo.hasPreviousPage,
        startCursor: documents.pageInfo.startCursor,
        endCursor: documents.pageInfo.endCursor,
      }

      if (format === 'json') {
        print(successList(data, pageInfo))
      } else {
        printList(data, format, {
          columns: COLUMNS,
          primaryKey: 'title',
          secondaryKey: 'id',
          pageInfo,
        })
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
