import {Command, Flags} from '@oclif/core'
import {requireApiKey} from '../lib/config.js'
import {success, error, print} from '../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../lib/errors.js'

const LINEAR_API_URL = 'https://api.linear.app/graphql'

interface GraphQLResponse {
  data?: unknown
  errors?: Array<{message: string; locations?: unknown; path?: unknown}>
}

export default class Query extends Command {
  static override description = 'Execute a raw GraphQL query against the Linear API'

  static override examples = [
    '<%= config.bin %> query --gql "query { viewer { id name email } }"',
    '<%= config.bin %> query --gql "query { teams { nodes { id key name } } }"',
    '<%= config.bin %> query --gql "query($id: String!) { issue(id: $id) { title } }" --variables \'{"id":"xxx"}\'',
  ]

  static override flags = {
    gql: Flags.string({
      char: 'g',
      description: 'GraphQL query string',
      required: true,
    }),
    variables: Flags.string({
      char: 'v',
      description: 'JSON object of query variables',
    }),
    timeout: Flags.integer({
      char: 't',
      description: 'Request timeout in seconds (default: 30)',
      default: 30,
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Query)
    const controller = new AbortController()
    let timeoutHandle: NodeJS.Timeout | undefined
    const timeoutSeconds = flags.timeout ?? 30

    try {
      const apiKey = requireApiKey()

      let variables: Record<string, unknown> | undefined
      if (flags.variables) {
        try {
          variables = JSON.parse(flags.variables) as Record<string, unknown>
        } catch {
          print(error('INVALID_INPUT', 'Invalid JSON in --variables flag'))
          this.exit(1)
          return
        }
      }

      timeoutHandle = setTimeout(() => controller.abort(), timeoutSeconds * 1000)

      const response = await fetch(LINEAR_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiKey,
        },
        body: JSON.stringify({
          query: flags.gql,
          variables,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutHandle)

      if (!response.ok) {
        print(error('API_ERROR', `Linear API returned ${response.status}: ${response.statusText}`))
        this.exit(1)
        return
      }

      let result: GraphQLResponse
      try {
        result = (await response.json()) as GraphQLResponse
      } catch (parseError) {
        throw new CliError(
          ErrorCodes.API_ERROR,
          `Failed to parse Linear API response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`,
          {status: response.status, statusText: response.statusText},
        )
      }

      if (result.errors && result.errors.length > 0) {
        print(
          error('GRAPHQL_ERROR', result.errors[0].message, {
            errors: result.errors,
          }),
        )
        this.exit(1)
        return
      }

      print(success(result.data))
    } catch (err) {
      if (timeoutHandle) clearTimeout(timeoutHandle)

      if (err instanceof Error && err.name === 'AbortError') {
        print(error(ErrorCodes.API_ERROR, `Request timed out after ${timeoutSeconds} seconds`))
        this.exit(1)
        return
      }

      handleError(err)
      this.exit(1)
    }
  }
}
