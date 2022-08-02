import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ECommerceApiStack } from "../lib/ecommerceApi-stack";
import { ProductsAppStack } from "../lib/productsApp-stack";
import { ProductsAppLayersStack } from "../lib/productsAppLayer-stack";
import { EventsDdbStack } from "../lib/eventsDdb-stack";

const app = new cdk.App();

const env: cdk.Environment = {
  account: "078155469454",
  region: "us-east-1",
};

const tags = {
  cost: "ECommerce",
  team: "DaviDev",
};

const productsAppLayersStack = new ProductsAppLayersStack(
  app,
  "ProductAppLayersStack",
  {
    env,
    tags,
  },
);
const eventsDdbStack = new EventsDdbStack(app, "EventsDdb", {
  env,
  tags,
});
const productAppStack = new ProductsAppStack(app, "ProductApp", {
  eventsDdb: eventsDdbStack.table,
  env,
  tags,
});
productAppStack.addDependency(productsAppLayersStack);
productAppStack.addDependency(eventsDdbStack);

const eCommerceApiStack = new ECommerceApiStack(app, "ECommerceApi", {
  productsFetchHandler: productAppStack.productsFetchHandler,
  productsAdminHandler: productAppStack.productsAdminHandler,
  env,
  tags,
});

eCommerceApiStack.addDependency(productAppStack);
