# Deploy to AWS S3 as a Static Site

## Current deployment

| | |
| --- | --- |
| Site (HTTPS) | https://dyutudqngrxa9.cloudfront.net |
| S3 website (HTTP only) | http://earth-trend-detective.s3-website-ap-southeast-1.amazonaws.com |
| Bucket | `earth-trend-detective` (ap-southeast-1) |
| CloudFront distribution | `E3M9ADCEUAQ2XY` |
| AWS CLI profile | `cloudwar` |
| Detective AI (Lambda) | `earth-trend-detective-ask` (ap-southeast-1), reached at `/api/*` through CloudFront |

Share the CloudFront address: the S3 website address has no HTTPS, so browsers warn or block it.

To publish changes, see [Re-deploy after changes](#6-re-deploy-after-changes).

---

## Prerequisites
- AWS CLI installed and configured (`aws configure`)
- An S3 bucket created (e.g. `my-flood-trends-app`)

---

## 1. Build the app

```bash
cd flood-trends-app
npm run build
# Output is in the dist/ folder
```

---

## 2. Create and configure the S3 bucket

```bash
BUCKET=my-flood-trends-app
REGION=ap-southeast-1   # change to your preferred region

# Create bucket
aws s3api create-bucket \
  --bucket $BUCKET \
  --region $REGION \
  --create-bucket-configuration LocationConstraint=$REGION

# Enable static website hosting
aws s3 website s3://$BUCKET/ \
  --index-document index.html \
  --error-document index.html

# Disable "Block all public access"
aws s3api put-public-access-block \
  --bucket $BUCKET \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Set a public-read bucket policy
aws s3api put-bucket-policy --bucket $BUCKET --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::'"$BUCKET"'/*"
  }]
}'
```

---

## 3. Upload the build output

```bash
# Hashed JS/CSS can be cached forever; everything else (index.html, power-cache.json) must revalidate
aws s3 sync dist/assets s3://$BUCKET/assets --delete --cache-control "public, max-age=31536000, immutable"
aws s3 sync dist s3://$BUCKET --exclude "assets/*" --delete --cache-control "no-cache"
```

---

## 4. Get your site URL

```bash
echo "http://$BUCKET.s3-website-$REGION.amazonaws.com"
```

---

## 5. (Optional) Add CloudFront for HTTPS + CDN

```bash
# Create a CloudFront distribution pointing to the S3 website endpoint
aws cloudfront create-distribution \
  --origin-domain-name "$BUCKET.s3-website-$REGION.amazonaws.com" \
  --default-root-object index.html \
  --query 'Distribution.DomainName' \
  --output text
```

For a custom domain, add an ACM certificate (us-east-1 region) and a CNAME/Alias record in Route 53.

---

## 6. Re-deploy after changes

```bash
npm run build
# Hashed JS/CSS can be cached forever; everything else (index.html, power-cache.json) must revalidate
aws s3 sync dist/assets s3://earth-trend-detective/assets --delete \
  --cache-control "public, max-age=31536000, immutable" --profile cloudwar --region ap-southeast-1
aws s3 sync dist s3://earth-trend-detective --exclude "assets/*" --delete \
  --cache-control "no-cache" --profile cloudwar --region ap-southeast-1

# Clear CloudFront's copy so visitors get the new version straight away
aws cloudfront create-invalidation --distribution-id E3M9ADCEUAQ2XY --paths "/*" --profile cloudwar
```

---

## 7. Detective AI on AWS Lambda

CloudFront sends `/api/*` to the Lambda function `earth-trend-detective-ask` (code in `lambda/`, shared with `server.mjs`).
The Gemini key lives only in the function's environment variables. CloudFront adds a secret `x-origin-verify`
header, and the function rejects any request without it, so its own URL cannot be used directly.

Update the code after changing `lambda/ask.mjs` or `lambda/index.mjs`:

```bash
(cd lambda && zip -q /tmp/detective.zip index.mjs ask.mjs limit.mjs)
aws lambda update-function-code --function-name earth-trend-detective-ask \
  --zip-file fileb:///tmp/detective.zip --profile cloudwar --region ap-southeast-1
```

Change the API key or a limit (the update replaces all variables, so read them first and send them all back):

```bash
aws lambda get-function-configuration --function-name earth-trend-detective-ask \
  --query Environment --profile cloudwar --region ap-southeast-1
aws lambda update-function-configuration --function-name earth-trend-detective-ask \
  --environment 'Variables={GEMINI_API_KEY=...,ORIGIN_SECRET=...,LIMIT_TABLE=etd-detective-rate-limits,LIMIT_IP_PER_MINUTE=5,LIMIT_IP_PER_DAY=50,LIMIT_SITE_PER_DAY=500}' \
  --profile cloudwar --region ap-southeast-1
```

Optional variables: `GEMINI_MODEL` (default `gemini-3.5-flash-lite`), or `ANTHROPIC_API_KEY` to use Claude instead.
Logs: CloudWatch log group `/aws/lambda/earth-trend-detective-ask`.

### Rate limits

AI calls are limited through the DynamoDB table `etd-detective-rate-limits` (on-demand, shared by every Lambda instance):

| Limit | Default | Variable |
| --- | --- | --- |
| Per visitor, per minute | 5 | `LIMIT_IP_PER_MINUTE` |
| Per visitor, per day (UTC) | 50 | `LIMIT_IP_PER_DAY` |
| Whole site, per day (UTC) | 500 | `LIMIT_SITE_PER_DAY` |

Visitors are identified by a salted hash of their IP address; counters delete themselves after about a day.
Requests blocked by a visitor's own limit do not count toward the site limit, so one visitor cannot lock out everyone else.
When a limit is hit, the chat says which one and when AI answers return, and answers from its built-in rules meanwhile.
If the table cannot be reached, calls are allowed (and logged) rather than switching the AI off.

See today's site total:

```bash
aws dynamodb get-item --table-name etd-detective-rate-limits --key '{"pk":{"S":"all#d#'$(date -u +%F)'"}}' \
  --query Item.n.N --profile cloudwar --region ap-southeast-1
```

---

## Notes

- The app is fully static — all data and chart logic runs in the browser.
- The `Ask Detective` chat gets AI answers from the Lambda function (section 7). If the function or Gemini
  fails, the chat falls back to its built-in answers, so it never breaks.
