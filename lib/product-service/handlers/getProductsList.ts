import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { products } from '../mock/products';

export const handler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(products),
  };
};
