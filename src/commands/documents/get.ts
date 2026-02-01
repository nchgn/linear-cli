import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class DocumentsGet extends Command {
  static override description = 'Get document details'

  static override examples = [
    '<%= config.bin %> documents get DOCUMENT_ID',
    '<%= config.bin %> documents get DOCUMENT_ID --format table',
  ]

  static override args = {
    id: Args.string({
      description: 'Document ID',
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
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(DocumentsGet)
      const format = flags.format as OutputFormat
      const client = getClient()

      const document = await client.document(args.id)

      if (!document) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Document ${args.id} not found`)
      }

      const [project, creator] = await Promise.all([document.project, document.creator])

      const data = {
        id: document.id,
        title: document.title,
        content: document.content,
        icon: document.icon ?? null,
        color: document.color ?? null,
        project: project
          ? {
              id: project.id,
              name: project.name,
            }
          : null,
        creator: creator
          ? {
              id: creator.id,
              name: creator.name,
            }
          : null,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            title: data.title,
            project: data.project?.name ?? 'None',
            creator: data.creator?.name ?? 'Unknown',
            content: data.content ? `${data.content.slice(0, 100)}...` : 'Empty',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Record<string, unknown>,
          format,
        )
      } else {
        console.log(data.id)
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
