# Module 3 — Serverless API with AWS Lambda & API Gateway

Task for **Module 3: Serverless** of the AWS in Node.js course.

## Overview

This project implements a Product Service using AWS Lambda and API Gateway, deployed with AWS CDK (TypeScript). It exposes two REST endpoints backed by Lambda functions that return mock product data.

## Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/products` | Returns the full list of products |
| GET | `/products/{productId}` | Returns a single product by ID, or 404 if not found |

## Project Structure

```
bin/
  aws-lambda-task.ts                 # CDK app entry point
lib/
  aws-lambda-task-stack.ts           # CDK stack — Lambda functions + API Gateway
  product-service/
    handlers/
      getProductsList.ts             # Handler for GET /products
      getProductsById.ts             # Handler for GET /products/{productId}
    mock/
      products.ts                    # Mock product data
test/
  aws-lambda-task.test.ts            # Unit tests for Lambda handlers
```

## API Response Examples

**GET /products**
```json
[
  {
    "id": "7567ec4b-b10c-48c5-9345-fc73c48a80aa",
    "title": "ProductOne",
    "description": "Short Product Description1",
    "price": 24,
    "count": 5
  }
]
```

**GET /products/{productId}** — product found
```json
{
  "id": "7567ec4b-b10c-48c5-9345-fc73c48a80aa",
  "title": "ProductOne",
  "description": "Short Product Description1",
  "price": 24,
  "count": 5
}
```

**GET /products/{productId}** — product not found
```json
{ "message": "Product not found" }
```

## Getting Started

### Prerequisites

- Node.js 20+
- AWS CLI configured (`aws configure`)
- AWS CDK bootstrapped (`npx cdk bootstrap`)

### Install dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Run unit tests

```bash
npm test
```

### Deploy to AWS

```bash
npx aws-cdk deploy
```

The API URL will be printed in the terminal output after a successful deploy.

### Destroy the stack

```bash
npx aws-cdk destroy
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run watch` | Watch and recompile on changes |
| `npm test` | Run unit tests |
| `npx cdk deploy` | Deploy stack to AWS |
| `npx cdk diff` | Compare local stack with deployed state |
| `npx cdk synth` | Print the synthesized CloudFormation template |
| `npx cdk destroy` | Remove the stack from AWS |
