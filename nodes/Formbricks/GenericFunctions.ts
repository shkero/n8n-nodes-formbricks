import {
  IDataObject,
  IExecuteFunctions,
  IHookFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
  ILoadOptionsFunctions,
  INodePropertyOptions,
  JsonObject,
  NodeApiError,
  NodeOperationError,
} from "n8n-workflow";

/**
 * Make an API request to Formbricks
 */
export async function apiRequest(
  this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
  method: IHttpRequestMethods,
  resource: string,
  body: object,
  query: IDataObject = {},
  option: IDataObject = {},
  apiVersion = "v2"
): Promise<any> {
  const credentials = await this.getCredentials("formbricksApi");

  let options: IHttpRequestOptions = {
    baseURL: `${credentials.host}/api/${apiVersion}`,
    method,
    body,
    qs: query,
    url: resource,
    headers: {
      "x-api-key": credentials.apiKey,
    },
  };

  if (!Object.keys(query).length) {
    delete options.qs;
  }

  options = Object.assign({}, options, option);
  try {
    return await this.helpers.httpRequestWithAuthentication.call(
      this,
      "formbricksApi",
      options
    );
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject);
  }
}

/**
 * Returns all workspaces available to the organization API key.
 */
export async function getWorkspaces(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const responseData = await apiRequest.call(this, "GET", "/me", {});
  const workspaces =
    responseData.workspaces ||
    responseData.data?.workspaces ||
    responseData.workspacePermissions ||
    responseData.data?.workspacePermissions ||
    responseData.environments ||
    responseData.data?.environments ||
    responseData.environmentPermissions ||
    responseData.data?.environmentPermissions;

  if (!Array.isArray(workspaces)) {
    throw new NodeOperationError(
      this.getNode(),
      "No Formbricks workspaces got returned from GET /api/v2/me"
    );
  }

  const returnData = workspaces
    .filter((workspace) => workspace.workspaceId)
    .map((workspace) => {
      const workspaceName = workspace.projectName || workspace.workspaceName || workspace.workspaceId;
      const permission = workspace.permissions || workspace.permission;
      const permissionLabel =
        typeof permission === "string"
          ? ` (${permission.charAt(0).toUpperCase()}${permission.slice(1)})`
          : "";

      return {
        name: `${workspaceName}${permissionLabel}`,
        value: workspace.workspaceId,
      };
    });

  if (returnData.length === 0) {
    throw new NodeOperationError(
      this.getNode(),
      "No Formbricks workspaces with workspaceId got returned from GET /api/v2/me"
    );
  }

  return returnData;
}

/**
 * Returns surveys for the selected workspace.
 */
export async function getSurveys(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const workspaceId = (this.getCurrentNodeParameter("workspaceId") as string | undefined)?.trim();

  if (!workspaceId) {
    throw new NodeOperationError(this.getNode(), "Select a Formbricks workspace first");
  }

  const responseData = await apiRequest.call(this, "GET", "/management/surveys", {}, {}, {}, "v1");
  const surveys = responseData.data;

  if (!Array.isArray(surveys)) {
    throw new NodeOperationError(
      this.getNode(),
      "No Formbricks surveys got returned from GET /api/v1/management/surveys"
    );
  }

  return surveys
    .filter((survey) => survey.workspaceId === workspaceId)
    .map((survey) => ({
      name: survey.name || survey.id,
      value: survey.id,
    }));
}
