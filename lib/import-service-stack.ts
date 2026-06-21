import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

interface ImportServiceStackProps extends cdk.StackProps {
  catalogItemsQueue: sqs.Queue;
}

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ImportServiceStackProps) {
    super(scope, id, props);

    const { catalogItemsQueue } = props;

    // S3 bucket for CSV uploads
    const importBucket = new s3.Bucket(this, 'ImportBucket', {
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // importProductsFile — returns a pre-signed S3 URL for CSV upload
    const importProductsFile = new NodejsFunction(this, 'importProductsFile', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'import-service/handlers/importProductsFile.ts'),
      environment: {
        BUCKET_NAME: importBucket.bucketName,
      },
      bundling: {
        nodeModules: ['@aws-sdk/s3-request-presigner'],
      },
    });

    importBucket.grantPut(importProductsFile);

    // importFileParser — triggered by S3, parses CSV, sends each row to SQS
    const importFileParser = new NodejsFunction(this, 'importFileParser', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'import-service/handlers/importFileParser.ts'),
      environment: {
        CATALOG_ITEMS_QUEUE_URL: catalogItemsQueue.queueUrl,
      },
      bundling: {
        nodeModules: ['csv-parser'],
      },
    });

    importBucket.grantReadWrite(importFileParser);
    catalogItemsQueue.grantSendMessages(importFileParser);

    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParser),
      { prefix: 'uploaded/' },
    );

    // API Gateway for Import Service
    const api = new apigateway.RestApi(this, 'ImportServiceApi', {
      restApiName: 'Import Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    api.root
      .addResource('import')
      .addMethod('GET', new apigateway.LambdaIntegration(importProductsFile));

    new cdk.CfnOutput(this, 'ImportServiceApiUrl', {
      value: api.url,
      description: 'Import Service API URL',
    });
  }
}
