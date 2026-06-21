import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

// TODO: Replace with your email address(es) before deploying
const EMAIL_LOW_PRICE = 'your-email@example.com';
const EMAIL_HIGH_PRICE = 'your-email@example.com';

export class ProductServiceStack extends cdk.Stack {
  public readonly catalogItemsQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SQS queue
    this.catalogItemsQueue = new sqs.Queue(this, 'catalogItemsQueue', {
      queueName: 'catalogItemsQueue',
    });

    // SNS topic
    const createProductTopic = new sns.Topic(this, 'createProductTopic', {
      topicName: 'createProductTopic',
    });

    // Email subscription — products with price < 100
    createProductTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(EMAIL_LOW_PRICE, {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({ lessThan: 100 }),
        },
      }),
    );

    // Email subscription — products with price >= 100
    createProductTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(EMAIL_HIGH_PRICE, {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({ greaterThanOrEqualTo: 100 }),
        },
      }),
    );

    // catalogBatchProcess Lambda (SQS trigger)
    const catalogBatchProcess = new NodejsFunction(this, 'catalogBatchProcess', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'product-service/handlers/catalogBatchProcess.ts'),
      environment: {
        SNS_TOPIC_ARN: createProductTopic.topicArn,
      },
    });

    createProductTopic.grantPublish(catalogBatchProcess);
    this.catalogItemsQueue.grantConsumeMessages(catalogBatchProcess);

    catalogBatchProcess.addEventSource(
      new lambdaEventSources.SqsEventSource(this.catalogItemsQueue, { batchSize: 5 }),
    );

    // API Gateway Lambdas
    const getProductsList = new NodejsFunction(this, 'getProductsList', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'product-service/handlers/getProductsList.ts'),
    });

    const getProductsById = new NodejsFunction(this, 'getProductsById', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'product-service/handlers/getProductsById.ts'),
    });

    const api = new apigateway.RestApi(this, 'ProductServiceApi', {
      restApiName: 'Product Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsList));
    productsResource
      .addResource('{productId}')
      .addMethod('GET', new apigateway.LambdaIntegration(getProductsById));

    new cdk.CfnOutput(this, 'ProductServiceApiUrl', {
      value: api.url,
      description: 'Product Service API URL',
    });

    new cdk.CfnOutput(this, 'SQSQueueUrl', {
      value: this.catalogItemsQueue.queueUrl,
      description: 'SQS catalogItemsQueue URL',
      exportName: 'CatalogItemsQueueUrl',
    });
  }
}
