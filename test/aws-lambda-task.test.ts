import { SQSEvent, SQSRecord } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { handler as getProductsList } from '../lib/product-service/handlers/getProductsList';
import { handler as getProductsById } from '../lib/product-service/handlers/getProductsById';
import { handler as catalogBatchProcess } from '../lib/product-service/handlers/catalogBatchProcess';
import { products } from '../lib/product-service/mock/products';

// ── AWS SDK mocks ────────────────────────────────────────────────────────────
const snsMock = mockClient(SNSClient);

// ── Helpers ──────────────────────────────────────────────────────────────────
const mockEvent = {} as APIGatewayProxyEvent;

const makeSqsRecord = (body: object): SQSRecord =>
  ({
    messageId: '1',
    receiptHandle: 'receipt',
    body: JSON.stringify(body),
    attributes: {
      ApproximateReceiveCount: '1',
      SentTimestamp: '1',
      SenderId: 'sender',
      ApproximateFirstReceiveTimestamp: '1',
    },
    messageAttributes: {},
    md5OfBody: '',
    eventSource: 'aws:sqs',
    eventSourceARN: 'arn:aws:sqs:us-east-1:123:catalogItemsQueue',
    awsRegion: 'us-east-1',
  }) as SQSRecord;

// ── getProductsList ───────────────────────────────────────────────────────────
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

// ── getProductsById ───────────────────────────────────────────────────────────
describe('getProductsById', () => {
  it('returns 200 with the matched product', async () => {
    const target = products[0];
    const event = { pathParameters: { productId: target.id } } as unknown as APIGatewayProxyEvent;

    const result = await getProductsById(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(target);
  });

  it('returns 404 when product is not found', async () => {
    const event = {
      pathParameters: { productId: 'non-existent' },
    } as unknown as APIGatewayProxyEvent;

    const result = await getProductsById(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({ message: 'Product not found' });
  });

  it('returns 404 when pathParameters is null', async () => {
    const event = { pathParameters: null } as unknown as APIGatewayProxyEvent;

    const result = await getProductsById(event);

    expect(result.statusCode).toBe(404);
  });
});

// ── catalogBatchProcess ───────────────────────────────────────────────────────
describe('catalogBatchProcess', () => {
  beforeEach(() => {
    snsMock.reset();
    process.env.PRODUCTS_TABLE_NAME = 'products';
    process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:createProductTopic';
  });

  it('sends one SNS message per SQS record', async () => {
    snsMock.on(PublishCommand).resolves({ MessageId: '1', $metadata: {} });

    const event: SQSEvent = {
      Records: [
        makeSqsRecord({ title: 'ProductA', price: 10, count: 2 }),
        makeSqsRecord({ title: 'ProductB', price: 50, count: 1 }),
      ],
    };

    await catalogBatchProcess(event);

    expect(snsMock.calls()).toHaveLength(2);
  });

  it('generates an id when the record has none', async () => {
    snsMock.on(PublishCommand).resolves({ MessageId: '1', $metadata: {} });

    const event: SQSEvent = {
      Records: [makeSqsRecord({ title: 'NoId', price: 5, count: 1 })],
    };

    await catalogBatchProcess(event);

    const publishInput = snsMock.calls()[0].args[0].input as { Message: string };
    const item = JSON.parse(publishInput.Message);
    expect(item.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('includes price in SNS message attributes for filter policy', async () => {
    snsMock.on(PublishCommand).resolves({ MessageId: '1', $metadata: {} });

    const event: SQSEvent = {
      Records: [makeSqsRecord({ title: 'Expensive', price: 150, count: 1 })],
    };

    await catalogBatchProcess(event);

    const publishInput = snsMock.calls()[0].args[0].input as {
      MessageAttributes: Record<string, { StringValue: string }>;
    };
    expect(publishInput.MessageAttributes.price.StringValue).toBe('150');
  });
});
