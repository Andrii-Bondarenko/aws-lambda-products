#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { ProductServiceStack } from '../lib/aws-lambda-task-stack';
import { ImportServiceStack } from '../lib/import-service-stack';

const app = new cdk.App();

const productService = new ProductServiceStack(app, 'ProductServiceStack', {});

new ImportServiceStack(app, 'ImportServiceStack', {
  catalogItemsQueue: productService.catalogItemsQueue,
});
