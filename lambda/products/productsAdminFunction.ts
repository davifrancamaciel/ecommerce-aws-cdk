import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { DynamoDB, Lambda } from "aws-sdk";
import { ProductEvent, ProductEventType } from "/opt/nodejs/productEventsLayer";
import { Product, ProductRepository } from "/opt/nodejs/productsLayer";

import * as AWSXRay from "aws-xray-sdk";
AWSXRay.captureAWS(require("aws-sdk"));

const productDdb = process.env.PRODUCTS_DDB!;
const ddbClient = new DynamoDB.DocumentClient();
const productRepository = new ProductRepository(ddbClient, productDdb);

const productEventsFunctionName = process.env.PRODUCT_EVENTS_FUNCTION_NAME!;
const lambdaClient = new Lambda();

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
    const product = JSON.parse(event.body!) as Product;
    const productCreated = await productRepository.create(product);
    const response = await sendProductEvent(
      productCreated,
      ProductEventType.CREATED,
      "davi@gmail.com",
      lambdaRequestId,
    );
    console.log(response);
    return {
      statusCode: 201,
      body: JSON.stringify({ message: "post products ok", productCreated }),
    };
  }
  if (resource === "/products/{id}") {
    const id = event.pathParameters!.id as string;
    if (httpMethod === "PUT") {
      try {
        const product = JSON.parse(event.body!) as Product;
        const productUpdated = await productRepository.update(product);
        const response = await sendProductEvent(
          productUpdated,
          ProductEventType.UPDATED,
          "mayara@gmail.com",
          lambdaRequestId,
        );
        console.log(response);
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "PUT products ok", productUpdated }),
        };
      } catch (error) {
        return {
          statusCode: 400,
          body: (<Error>error).message,
        };
      }
    } else if (httpMethod === "DELETE") {
      try {
        const product = await productRepository.delete(id);
        const response = await sendProductEvent(
          product,
          ProductEventType.DELETED,
          "bernardo@gmail.com",
          lambdaRequestId,
        );
        console.log(response);
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "DELETE products ok", product }),
        };
      } catch (error) {
        return {
          statusCode: 400,
          body: (<Error>error).message,
        };
      }
    }
  }
  return {
    statusCode: 400,
    body: JSON.stringify({ message: "Deu ruim" }),
  };
}

const sendProductEvent = (
  product: Product,
  eventType: ProductEventType,
  email: string,
  lambdaRequestId: string,
) => {
  const event: ProductEvent = {
    requestId: lambdaRequestId,
    eventType,
    productId: product.id,
    productCode: product.code,
    productPrice: product.price,
    email,
  };
  return lambdaClient
    .invoke({
      FunctionName: productEventsFunctionName,
      Payload: JSON.stringify(event),
      InvocationType: "RequestResponse",
    })
    .promise();
};
