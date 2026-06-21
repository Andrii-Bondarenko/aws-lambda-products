# AWS Node.js Course — Product Service

Tasks for the **AWS in Node.js** course.
Covers **Module 6: Async Messaging** (SQS + SNS).

---

## Module 6 — Async Messaging with SQS & SNS

### What was done

**Product Service additions:**
- `catalogItemsQueue` — SQS queue that receives product data from the Import Service
- `catalogBatchProcess` — Lambda triggered by SQS with `batchSize: 5`; iterates over messages, logs each product to CloudWatch, and publishes an SNS event per product
- `createProductTopic` — SNS topic with two email subscriptions filtered by price:
  - Products with `price < 100` → first email address
  - Products with `price >= 100` → second email address

**Import Service (new stack):**
- `importProductsFile` — `GET /import?name=<filename>` returns a pre-signed S3 URL so the client can upload a CSV directly to S3
- `importFileParser` — triggered by `s3:ObjectCreated` on the `uploaded/` prefix; parses each CSV row and sends it as a message to `catalogItemsQueue`; moves the file to `parsed/` when done

**Flow:**
```
Frontend → PUT CSV → S3 (uploaded/)
                      ↓  S3 event
             importFileParser Lambda
                      ↓  SendMessage
             catalogItemsQueue (SQS)
                      ↓  batchSize: 5
         catalogBatchProcess Lambda
                      ↓  console.log + Publish
             createProductTopic (SNS)
                      ↓  filter by price
            email (low) / email (high)
```

---

## Project Structure

```
bin/
  aws-lambda-task.ts                       # CDK app — instantiates both stacks
lib/
  aws-lambda-task-stack.ts                 # ProductServiceStack (Lambda + API GW + SQS + SNS)
  import-service-stack.ts                  # ImportServiceStack  (S3 + Lambda + API GW)
  product-service/
    handlers/
      getProductsList.ts                   # GET /products
      getProductsById.ts                   # GET /products/{productId}
      catalogBatchProcess.ts               # SQS trigger → log + SNS publish
    mock/
      products.ts                          # Mock product data
  import-service/
    handlers/
      importProductsFile.ts                # GET /import?name= → pre-signed S3 URL
      importFileParser.ts                  # S3 trigger → parse CSV → SQS
test/
  aws-lambda-task.test.ts                  # Unit tests for all handlers
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- AWS CLI configured (`aws configure`)
- AWS CDK bootstrapped (`npx cdk bootstrap`)

### Setup

```bash
npm install
```

Before deploying, set your email addresses in `lib/aws-lambda-task-stack.ts`:
```typescript
const EMAIL_LOW_PRICE  = 'your-email@example.com';
const EMAIL_HIGH_PRICE = 'your-email@example.com';
```

### Build

```bash
npm run build
```

### Run unit tests

```bash
npm test
```

### Deploy all stacks

```bash
npx aws-cdk deploy --all --require-approval never
```

API URLs are printed as stack outputs after deployment.

### Destroy all stacks

```bash
npx aws-cdk destroy --all
```

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run watch` | Watch and recompile on changes |
| `npm test` | Run unit tests |
| `npx cdk deploy --all` | Deploy both stacks to AWS |
| `npx cdk diff` | Compare local stack with deployed state |
| `npx cdk synth` | Print the synthesized CloudFormation template |
| `npx cdk destroy --all` | Remove both stacks from AWS |
