import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { v4 as uuid } from "uuid";

export interface Product {
  id: string;
  productName: string;
  code: string;
  price: number;
  model: string;
  image: string;
}

export class ProductRepository {
  private ddbClient: DocumentClient;
  private productsDdb: string;
  constructor(ddbClient: DocumentClient, productsDdb: string) {
    this.ddbClient = ddbClient;
    this.productsDdb = productsDdb;
  }

  async getAllProducts(): Promise<Product[]> {
    const data = await this.ddbClient
      .scan({
        TableName: this.productsDdb,
      })
      .promise();
    return data.Items as Product[];
  }

  async getProductById(id: string): Promise<Product> {
    const data = await this.ddbClient
      .get({
        TableName: this.productsDdb,
        Key: { id },
      })
      .promise();
    if (data.Item) return data.Item as Product;
    else throw new Error("Product not found");
  }

  async create(product: Product): Promise<Product> {
    product.id = uuid();
    await this.ddbClient
      .put({
        TableName: this.productsDdb,
        Item: product,
      })
      .promise();
    return product;
  }

  async update(product: Product): Promise<Product> {
    const data = await this.ddbClient
      .update({
        TableName: this.productsDdb,
        Key: {
          id: product.id,
        },
        ConditionExpression: "attribute_exists(id)",
        ReturnValues: "UPDATED_NEW",
        UpdateExpression:
          "SET productName = :productName, price = :price, model = :model, code = :code, image = :image",
        ExpressionAttributeValues: {
          ":productName": product.productName,
          ":price": product.price,
          ":model": product.model,
          ":code": product.code,
          ":image": product.image,
        },
      })
      .promise();
    data.Attributes!.id = product.id;
    return data.Attributes as Product;
  }

  async delete(id: string): Promise<Product> {
    const data = await this.ddbClient
      .delete({
        TableName: this.productsDdb,
        Key: { id },
        ConditionExpression: "attribute_exists(id)",
        ReturnValues: "ALL_OLD",
      })
      .promise();
    if (data.Attributes) return data.Attributes as Product;
    else throw new Error("Product not found");
  }
}
