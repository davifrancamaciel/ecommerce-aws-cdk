import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { ProductRepository } from "/opt/nodejs/productsLayer";
import { DynamoDB } from "aws-sdk";

import * as AWSXRay from "aws-xray-sdk";
AWSXRay.captureAWS(require("aws-sdk"));

const productDdb = process.env.PRODUCTS_DDB!;
const ddbClient = new DynamoDB.DocumentClient();
const productRepository = new ProductRepository(ddbClient, productDdb);

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const { httpMethod, resource } = event;
  const lambdaRequestId = context.awsRequestId;
  const apiRequestId = event.requestContext.requestId;

  console.log(
    `API Gateway RequestId: ${apiRequestId} - Lambda Request Id: ${lambdaRequestId}`,
  );
  if (resource === "/products") {
    if (httpMethod === "GET") {
      console.log("get");
      const products = await productRepository.getAllProducts();
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "get products ok", products }),
      };
    }
  }
  if (resource === "/products/{id}") {
    const id = event.pathParameters!.id as string;
    try {
      const product = await productRepository.getProductById(id);

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "get products ok", product }),
      };
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: (<Error>error).message }),
      };
    }
  }
  return {
    statusCode: 400,
    body: JSON.stringify({ message: "Deu ruim" }),
  };
}
