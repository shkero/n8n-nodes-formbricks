import { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from "n8n-workflow";

export class FormbricksApi implements ICredentialType {
  name = "formbricksApi";
  displayName = "Formbricks API";
  properties: INodeProperties[] = [
    {
      displayName: "Host",
      name: "host",
      description:
        'The address of your Formbricks instance. For Formbricks Cloud this is "https://app.formbricks.com". If you are hosting Formbricks yourself, it\'s the address where you can reach your instance.',
      type: "string",
      default: "https://app.formbricks.com",
    },
    {
      displayName: "API Key",
      name: "apiKey",
      description:
        'Your Formbricks organization API-Key. Credential testing and workspace loading require Organization Read access. Full webhook lifecycle requires Manage access for the selected workspace. Please read our <a href="https://formbricks.com/docs/api/api-key-setup">API Key Docs</a> for more details.',
      type: "string",
      typeOptions: { password: true },
      default: "",
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        "x-api-key": "={{$credentials.apiKey}}",
      },
    },
  };
  test: ICredentialTestRequest | undefined = {
    request: {
      baseURL: "={{$credentials.host}}/api/v2",
      url: "=/me",
    },
    rules: [
      {
        type: "responseCode",
        properties: {
          value: 401,
          message:
            "Authentication failed. Check the Host/API Key and make sure the key has Organization Read access.",
        },
      },
      {
        type: "responseCode",
        properties: {
          value: 403,
          message:
            "The API key is valid but lacks permission. Organization Read access is required to test credentials and load workspaces.",
        },
      },
    ],
  };
}
