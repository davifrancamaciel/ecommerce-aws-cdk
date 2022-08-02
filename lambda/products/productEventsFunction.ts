import { Callback, Context } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { ProductEvent } from "/opt/nodejs/productEventsLayer";
import * as AWSXRay from "aws-xray-sdk";
AWSXRay.captureAWS(require("aws-sdk"));

const eventsDdb = process.env.EVENTS_DDB!;
const ddbClient = new DynamoDB.DocumentClient();

export async function handler(
  event: ProductEvent,
  context: Context,
  callback: Callback,
): Promise<void> {
  console.log(event);
  console.log(`Lambda requestId ${context.awsRequestId}`);
  await createEvent(event);
  callback(
    null,
    JSON.stringify({
      productEventCreated: true,
      message: "ok",
    }),
  );
}

const createEvent = (event: ProductEvent) => {
  const timestamb = Date.now();
  const ttl = ~~(timestamb / 1000 + 5 + 60); // hora atual mais 5 min

  const { productCode, eventType, email, requestId, productId, productPrice } =
    event;

  return ddbClient
    .put({
      TableName: eventsDdb,
      Item: {
        pk: `#product_${productCode}`,
        sk: `${eventType}#${timestamb}`,
        email: email,
        createdAt: timestamb,
        requestId,
        eventType,
        info: {
          productId,
          price: productPrice,
        },
        ttl,
      },
    })
    .promise();
};
