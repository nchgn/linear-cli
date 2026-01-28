import type {LinearClient} from '@linear/sdk'
import {CliError, ErrorCodes} from './errors.js'

/**
 * Parse an issue identifier (e.g., ENG-123) into team key and number.
 */
export const parseIdentifier = (identifier: string): {teamKey: string; number: number} | null => {
  const match = identifier.match(/^([A-Za-z]+)-(\d+)$/)
  if (!match) {
    return null
  }
  return {
    teamKey: match[1].toUpperCase(),
    number: parseInt(match[2], 10),
  }
}

/**
 * Check if a string is a UUID (issue ID).
 */
export const isUUID = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

/**
 * Resolve an issue identifier or ID to an issue ID.
 * Supports both UUIDs and identifiers like ENG-123.
 */
export const resolveIssueId = async (client: LinearClient, idOrIdentifier: string): Promise<string> => {
  // If it's a UUID, return as-is
  if (isUUID(idOrIdentifier)) {
    return idOrIdentifier
  }

  // Try to parse as identifier
  const parsed = parseIdentifier(idOrIdentifier)
  if (!parsed) {
    throw new CliError(
      ErrorCodes.INVALID_INPUT,
      `Invalid issue ID or identifier: ${idOrIdentifier}. Expected UUID or format like ENG-123.`,
    )
  }

  // Find the team by key
  const teams = await client.teams({
    filter: {key: {eq: parsed.teamKey}},
    first: 1,
  })

  if (teams.nodes.length === 0) {
    throw new CliError(ErrorCodes.NOT_FOUND, `Team with key "${parsed.teamKey}" not found`)
  }

  const team = teams.nodes[0]

  // Find the issue by team and number
  const issues = await client.issues({
    filter: {
      team: {id: {eq: team.id}},
      number: {eq: parsed.number},
    },
    first: 1,
  })

  if (issues.nodes.length === 0) {
    throw new CliError(ErrorCodes.NOT_FOUND, `Issue ${idOrIdentifier} not found`)
  }

  return issues.nodes[0].id
}
