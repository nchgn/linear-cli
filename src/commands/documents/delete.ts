import {Args, Command} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'

export default class DocumentsDelete extends Command {
  static override description = 'Delete a document (moves to trash)'

  static override examples = ['<%= config.bin %> documents delete DOCUMENT_ID']

  static override args = {
    id: Args.string({
      description: 'Document ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args} = await this.parse(DocumentsDelete)
      const client = getClient()

      const payload = await client.deleteDocument(args.id)

      if (!payload.success) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to delete document')
      }

      print(
        success({
          id: args.id,
          deleted: true,
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
