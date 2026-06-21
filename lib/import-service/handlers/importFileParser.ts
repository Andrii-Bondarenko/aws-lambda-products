import { S3Event } from 'aws-lambda';
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Readable } from 'stream';
import csv from 'csv-parser';

const s3Client = new S3Client({});
const sqsClient = new SQSClient({});

export const handler = async (event: S3Event): Promise<void> => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const stream = response.Body as Readable;

    await new Promise<void>((resolve, reject) => {
      const sends: Promise<void>[] = [];

      stream
        .pipe(csv())
        .on('data', (data: Record<string, string>) => {
          sends.push(
            sqsClient
              .send(
                new SendMessageCommand({
                  QueueUrl: process.env.CATALOG_ITEMS_QUEUE_URL!,
                  MessageBody: JSON.stringify(data),
                }),
              )
              .then(() => undefined),
          );
        })
        .on('end', () => Promise.all(sends).then(() => resolve()).catch(reject))
        .on('error', reject);
    });

    const parsedKey = key.replace('uploaded/', 'parsed/');
    await s3Client.send(
      new CopyObjectCommand({ Bucket: bucket, CopySource: `${bucket}/${key}`, Key: parsedKey }),
    );
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
};
