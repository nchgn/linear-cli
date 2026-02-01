import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {LinearDocument} from '@linear/sdk'

type DocumentCreateInput = LinearDocument.DocumentCreateInput

export default class DocumentsCreate extends Command {
  static override description = 'Create a new document'

  static override examples = [
    '<%= config.bin %> documents create --title "My Document"',
    '<%= config.bin %> documents create --title "Project Doc" --project-id PROJECT_ID',
    '<%= config.bin %> documents create --title "Notes" --content "# Heading\\n\\nContent here"',
  ]

  static override flags = {
    title: Flags.string({
      char: 't',
      description: 'Document title',
      required: true,
    }),
    content: Flags.string({
      char: 'c',
      description: 'Document content (markdown)',
    }),
    'project-id': Flags.string({
      description: 'Project ID to associate with',
    }),
    icon: Flags.string({
      description: 'Document icon (emoji)',
    }),
    color: Flags.string({
      description: 'Document color (hex)',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(DocumentsCreate)
      const client = getClient()

      const input: DocumentCreateInput = {
        title: flags.title,
      }

      if (flags.content) input.content = flags.content
      if (flags['project-id']) input.projectId = flags['project-id']
      if (flags.icon) input.icon = flags.icon
      if (flags.color) input.color = flags.color

      const payload = await client.createDocument(input)

      if (!payload.success) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to create document')
      }

      const document = await payload.document
      if (!document) {
        throw new CliError(ErrorCodes.API_ERROR, 'Document not returned')
      }

      const project = await document.project

      print(
        success({
          id: document.id,
          title: document.title,
          project: project ? {id: project.id, name: project.name} : null,
          createdAt: document.createdAt,
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
