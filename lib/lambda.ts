import * as cdk from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IRole } from 'aws-cdk-lib/aws-iam';
import * as fs from 'fs';

// Load the config.json file
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));


/*
You will need to create a Lambda Layer for psycopg2 as base Lambda runtime does not include it.
1. git clone https://github.com/jkehler/awslambda-psycopg2.git
2. copy the version you need and rename the file to psycopg2 
3. zip -r  psycopg2.zip psycopg2
4. aws lambda publish-layer-version \ --layer-name psycopg2-layer \ --description "psycopg2-binary SQLAlchemy pymysql" \ --zip-file fileb://psycopg2.zip \ --compatible-runtimes python3.8 python3.9 \ --region ca-central-1
*/


export function createDbUserLambda(scope: Construct, iamRole: IRole, secretArn: string) {
  // Extract AWS account number and region from config.json
  const { AWS_ACCOUNT_NUMBER, AWS_REGION } = config;

  // Construct Lambda Layer ARN using the extracted values
  const layerArn = `arn:aws:lambda:${AWS_REGION}:${AWS_ACCOUNT_NUMBER}:layer:psycopg2-layer:2`;

  return new lambda.Function(scope, 'DbUserCreationFunction', {
    runtime: lambda.Runtime.PYTHON_3_8,
    handler: 'create_db_user.lambda_handler',
    code: lambda.Code.fromAsset('./lambda'),
    role: iamRole,
    environment: {
      SECRET_ARN: secretArn,
    },
    layers: [
      lambda.LayerVersion.fromLayerVersionArn(
        scope,
        'psycopg2-layer',
        layerArn
      ),
    ],
  });
}
