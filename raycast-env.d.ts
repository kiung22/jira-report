/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Jira URL - Your Jira instance URL (e.g., https://company.atlassian.net) */
  "jiraUrl": string,
  /** Email - Your Jira account email */
  "jiraEmail": string,
  /** Personal Access Token (PAT) - Your Jira Personal Access Token (from Jira Settings > Personal Access Tokens) */
  "jiraToken": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `generate-report` command */
  export type GenerateReport = ExtensionPreferences & {}
  /** Preferences accessible in the `settings` command */
  export type Settings = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `generate-report` command */
  export type GenerateReport = {}
  /** Arguments passed to the `settings` command */
  export type Settings = {}
}

