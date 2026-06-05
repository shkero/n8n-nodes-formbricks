import {
  IHookFunctions,
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
  NodeOperationError,
} from "n8n-workflow";

import { apiRequest, getWorkspaces } from "./GenericFunctions";

function parseSurveyIds(surveyIds: string | string[]): string[] {
  if (Array.isArray(surveyIds)) {
    return surveyIds;
  }

  return surveyIds
    .split(",")
    .map((surveyId) => surveyId.trim())
    .filter((surveyId) => surveyId !== "");
}

export class Formbricks implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Formbricks",
    name: "formbricks",
    icon: "file:formbricks.svg",
    group: ["trigger"],
    version: 1,
    subtitle: '=Surveys: {{$parameter["surveyIds"]}}',
    description: "Open Source Surveys & Experience Management Solution",
    defaults: {
      name: "Formbricks",
    },
    // eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
    inputs: [],
    outputs: ["main"],
    credentials: [
      {
        name: "formbricksApi",
        required: true,
      },
    ],
    webhooks: [
      {
        name: "default",
        httpMethod: "POST",
        responseMode: "onReceived",
        path: "webhook",
      },
    ],
    properties: [
      {
        displayName: "Workspace Name or ID",
        name: "workspaceId",
        description:
          'Workspace where the webhook should be registered. Manage access is recommended so n8n can create and delete webhooks. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getWorkspaces",
        },
        default: "",
        required: true,
      },
      {
        displayName: "Events",
        name: "events",
        type: "multiOptions",
        options: [
          {
            name: "Response Created",
            value: "responseCreated",
            description:
              "Triggers when a new response is created for a survey. Normally triggered after the first question was answered.",
          },
          {
            name: "Response Updated",
            value: "responseUpdated",
            description: "Triggers when a response is updated within a survey",
          },
          {
            name: "Response Finished",
            value: "responseFinished",
            description: "Triggers when a response is marked as finished",
          },
        ],
        default: [],
        required: true,
      },
      {
        // eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-multi-options
        displayName: "Survey IDs",
        name: "surveyIds",
        description:
          "Optional comma-separated survey IDs. Leave empty to trigger this node for all surveys in the workspace.",
        type: "string",
        default: "",
      },
    ],
  };
  methods = {
    loadOptions: {
      getWorkspaces,
    },
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData("node");
        const webhookUrl = this.getNodeWebhookUrl("default");
        const workspaceId = (this.getNodeParameter("workspaceId") as string).trim();
        const surveyIds = parseSurveyIds(this.getNodeParameter("surveyIds") as string | string[]);

        if (!workspaceId) {
          throw new NodeOperationError(
            this.getNode(),
            "Select a Formbricks workspace before activating this trigger."
          );
        }

        const endpoint = "/management/webhooks";
        const response = await apiRequest.call(this, "GET", endpoint, {}, { limit: 250 });

        for (const webhook of response.data) {
          const webhookSurveyIds = Array.isArray(webhook.surveyIds)
            ? webhook.surveyIds
            : [];
          const surveyIdsMatch =
            (surveyIds.length === 0 && webhookSurveyIds.length === 0) ||
            surveyIds.some((surveyId) => webhookSurveyIds.includes(surveyId));

          if (webhook.url === webhookUrl && webhook.workspaceId === workspaceId && surveyIdsMatch) {
            webhookData.webhookId = webhook.id;
            return true;
          }
        }
        return false;
      },
      async create(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData("node");
        const webhookUrl = this.getNodeWebhookUrl("default");
        const workspaceId = (this.getNodeParameter("workspaceId") as string).trim();
        const surveyIds = parseSurveyIds(this.getNodeParameter("surveyIds") as string | string[]);
        const events = this.getNodeParameter("events") as Array<string>;

        if (!Array.isArray(events) || events.length === 0) {
          throw new NodeOperationError(
            this.getNode(),
            "Select at least one Formbricks event before activating this trigger."
          );
        }

        if (!workspaceId) {
          throw new NodeOperationError(
            this.getNode(),
            "Select a Formbricks workspace before activating this trigger."
          );
        }

        const body = {
          name: null,
          workspaceId,
          url: webhookUrl,
          source: "n8n",
          triggers: events,
          surveyIds: surveyIds,
        };
        const endpoint = "/management/webhooks";

        const response = await apiRequest.call(this, "POST", endpoint, body);
        webhookData.webhookId = response.id;
        return true;
      },
      async delete(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData("node");

        if (webhookData.webhookId === undefined) {
          return true;
        }

        const endpoint = `/management/webhooks/${webhookData.webhookId}`;

        await apiRequest.call(this, "DELETE", endpoint, {});
        // Remove from the static workflow data so that it is clear
        // that no webhooks are registered anymore
        delete webhookData.webhookId;
        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const bodyData = this.getBodyData();
    // getting bodyData as string, so need to JSON parse it to convert to an object
    return {
      workflowData: [this.helpers.returnJsonArray(bodyData)],
    };
  }
}
