import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler as getProductsList } from '../lib/product-service/handlers/getProductsList';
import { handler as getProductsById } from '../lib/product-service/handlers/getProductsById';
import { products } from '../lib/product-service/mock/products';

const mockEvent = {} as APIGatewayProxyEvent;

describe('getProductsList', () => {
  it('returns 200 with all products', async () => {
    const result = await getProductsList(mockEvent);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(products);
  });

  it('includes CORS header', async () => {
    const result = await getProductsList(mockEvent);

    expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
  });
});

describe('getProductsById', () => {
  it('returns 200 with matched product', async () => {
    const target = products[0];
    const event = { pathParameters: { productId: target.id } } as unknown as APIGatewayProxyEvent;

    const result = await getProductsById(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(target);
  });

  it('returns 404 when product not found', async () => {
    const event = { pathParameters: { productId: 'non-existent-id' } } as unknown as APIGatewayProxyEvent;

    const result = await getProductsById(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({ message: 'Product not found' });
  });

  it('returns 404 when productId is missing', async () => {
    const event = { pathParameters: null } as unknown as APIGatewayProxyEvent;

    const result = await getProductsById(event);

    expect(result.statusCode).toBe(404);
  });
});
