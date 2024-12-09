import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    const role = event.pathParameters?.role;
    const movieId = event.pathParameters?.movieId
      ? parseInt(event.pathParameters.movieId, 10)
      : undefined;

    if (!role || !movieId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing or invalid role or movieId" }),
      };
    }

    const commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME_CREW,
      KeyConditionExpression: "movieId = :m AND crewRole = :r",
      ExpressionAttributeValues: {
        ":m": movieId,
        ":r": role,
      },
    };

    const commandOutput = await ddbDocClient.send(new QueryCommand(commandInput));

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        data: commandOutput.Items || [],
      }),
    };
  } catch (error: any) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: error.message || "Internal Server Error" }),
    };
  }
};

function createDocumentClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = { wrapNumbers: false };
  return DynamoDBDocumentClient.from(ddbClient, { marshallOptions, unmarshallOptions });
}
