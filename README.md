# n8n-nodes-formbricks-new

This is an n8n community trigger node for Formbricks survey events.

It registers Formbricks webhooks for selected surveys and emits incoming survey webhook payloads into an n8n workflow.

## Package

Published package name:

```sh
n8n-nodes-formbricks-new
```

This name follows the n8n community node package requirements: unscoped community node packages must start with `n8n-nodes-`, and the package includes the `n8n-community-node-package` keyword.

This package uses a new npm name because `n8n-nodes-formbricks` already exists on npm.

## Installation

After publishing to npm, install the package in a self-hosted n8n instance:

1. Go to **Settings > Community Nodes**.
2. Select **Install**.
3. Enter the npm package name: `n8n-nodes-formbricks-new`.
4. Accept the community node warning and install.

Manual installation is also possible from the n8n custom nodes directory:

```sh
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
npm install n8n-nodes-formbricks-new
```

Restart n8n after manual installation.

For an unpublished local build, create a tarball from this repository and install that file:

```sh
npm run build
npm pack
cd ~/.n8n/nodes
npm install /path/to/n8n-nodes-formbricks-new-1.0.3.tgz
```

Restart n8n after installing the local tarball.

## Credentials

Create Formbricks API credentials in n8n with:

- **Host**: your Formbricks base URL, for example `https://form.example.com`
- **API Key**: your Formbricks organization API key

The credential test calls:

```text
GET /api/v2/me
```

## Workspace Selection

Workspace is selected in the **Formbricks** trigger node, not in the credential.

The node loads available workspaces from the current Formbricks API v2:

```sh
curl -H "x-api-key: <API_KEY>" https://form.example.com/api/v2/me
```

It uses the returned `workspaces[]` array. The option label is based on `projectName`, and the option value is `workspaceId`.

## Usage

1. Add the **Formbricks** trigger node to an n8n workflow.
2. Select the workspace that should receive the webhook.
3. Select one or more events, for example **Response Finished**.
4. Optionally enter comma-separated Survey IDs. Leave the field empty to trigger for all surveys in the workspace.
5. Save and activate the workflow.

When the workflow is activated, n8n creates a production webhook URL and the node registers it in Formbricks with:

```json
{
  "name": null,
  "workspaceId": "<WORKSPACE_ID>",
  "url": "https://n8n.example.com/webhook/...",
  "source": "n8n",
  "triggers": ["responseFinished"],
  "surveyIds": ["<SURVEY_ID>"]
}
```

For production delivery, activate the workflow and use the **Production Webhook URL**. Production URLs use `/webhook/...`.

The `/webhook-test/...` URL is only for temporary test listening in the n8n editor. After test listening stops, Formbricks deliveries to `/webhook-test/...` will return 404.

If n8n is behind a reverse proxy, configure n8n's public webhook base URL, for example:

```sh
WEBHOOK_URL=https://n8n.example.com/
```

## Development

Install dependencies:

```sh
npm install
```

Build:

```sh
npm run build
```

Run lint if available:

```sh
npm run lint
```

Check package contents:

```sh
npm pack --dry-run
```

Publish:

```sh
npm adduser
npm login
npm version patch
npm publish
```

Publishing is optional for local use. It requires an npm account logged in on the publishing machine.

## Compatibility

This package is based on the upstream Formbricks n8n node and was updated to register webhooks through the Formbricks API v2 management webhook endpoints.

Formbricks API v2 currently exposes webhook management under `/api/v2/management/webhooks`. A v2 management survey list endpoint is not exposed in the current public docs/source, so Survey IDs are entered manually.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Formbricks API v2 reference](https://formbricks.com/docs/api-v2-reference/introduction)
- [Formbricks API v2 Me](https://formbricks.com/docs/api-v2-reference/me/me)
- [Formbricks API v2 webhook API](https://formbricks.com/docs/api-v2-reference/management-api--webhooks/create-a-webhook)
