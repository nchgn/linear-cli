import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {LinearDocument} from '@linear/sdk'

type DocumentUpdateInput = LinearDocument.DocumentUpdateInput

export default class DocumentsUpdate extends Command {
  static override description = 'Update a document'

  static override examples = [
    '<%= config.bin %> documents update DOCUMENT_ID --title "New Title"',
    '<%= config.bin %> documents update DOCUMENT_ID --content "Updated content"',
    '<%= config.bin %> documents update DOCUMENT_ID --project-id PROJECT_ID',
  ]

  static override args = {
    id: Args.string({
      description: 'Document ID',
      required: true,
    }),
  }

  static override flags = {
    title: Flags.string({
      char: 't',
      description: 'New document title',
    }),
    content: Flags.string({
      char: 'c',
      description: 'New document content (markdown)',
    }),
    'project-id': Flags.string({
      description: 'New project ID (empty string to remove)',
    }),
    icon: Flags.string({
      description: 'New document icon (emoji)',
    }),
    color: Flags.string({
      description: 'New document color (hex)',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(DocumentsUpdate)
      const client = getClient()

      const input: DocumentUpdateInput = {}

      if (flags.title) input.title = flags.title
      if (flags.content) input.content = flags.content
      if (flags['project-id'] !== undefined) {
        input.projectId = flags['project-id'] || null
      }
      if (flags.icon) input.icon = flags.icon
      if (flags.color) input.color = flags.color

      if (Object.keys(input).length === 0) {
        throw new CliError(ErrorCodes.INVALID_INPUT, 'No update fields provided')
      }

      const payload = await client.updateDocument(args.id, input)

      if (!payload.success) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to update document')
      }

      const document = await payload.document
      if (!document) {
        throw new CliError(ErrorCodes.API_ERROR, 'Document not returned')
      }

      print(
        success({
          id: document.id,
          title: document.title,
          updatedAt: document.updatedAt,
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
