import { SQSEvent } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { randomUUID } from 'crypto';

const snsClient = new SNSClient({});

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const product = JSON.parse(record.body);

    const item = {
      id: product.id ?? randomUUID(),
      title: product.title ?? '',
      description: product.description ?? '',
      price: Number(product.price) || 0,
      count: Number(product.count) || 0,
    };

    console.log('Creating product in table:', JSON.stringify(item));

    await snsClient.send(
      new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN!,
        Subject: 'New product created',
        Message: JSON.stringify(item),
        MessageAttributes: {
          price: {
            DataType: 'Number',
            StringValue: String(item.price),
          },
        },
      }),
    );
  }
};
