#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { AwsLambdaTaskStack } from '../lib/aws-lambda-task-stack';

const app = new cdk.App();
new AwsLambdaTaskStack(app, 'ProductServiceStack', {});

