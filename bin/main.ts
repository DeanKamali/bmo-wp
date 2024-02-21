import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcConstruct } from '../lib/vpc';
import { IamRoleConstruct } from '../lib/iam';
import { SecurityGroupConstruct } from '../lib/sg';
import { Ec2Construct } from '../lib/ec2';
import { RdsConstruct } from '../lib/rds';
import { SecretsManagerConstruct } from '../lib/sm'; 
import { LoadBalancerConstruct } from '../lib/alb'; 
import { createDbUserLambda } from '../lib/lambda';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'; 
import { InstanceTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets'; 
import * as fs from 'fs';

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

export class BMOWPStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpcConstruct = new VpcConstruct(this, 'VpcConstruct');
    const iamRoleConstruct = new IamRoleConstruct(this, 'IamRoleConstruct');
    const securityGroupConstruct = new SecurityGroupConstruct(this, 'SecurityGroupConstruct', vpcConstruct.vpc);
    const secretsManagerConstruct = new SecretsManagerConstruct(this, 'DBSecret', 'myDbSecret');
    const ec2Construct = new Ec2Construct(this, 'Ec2Construct', vpcConstruct.vpc, iamRoleConstruct.role, securityGroupConstruct.ec2SecurityGroup, secretsManagerConstruct.secret);
    new RdsConstruct(this, 'RdsConstruct', vpcConstruct.vpc, securityGroupConstruct.rdsSecurityGroup, secretsManagerConstruct.secret);
    const loadBalancerConstruct = new LoadBalancerConstruct(this, 'LoadBalancerConstruct', vpcConstruct.vpc, securityGroupConstruct.ec2SecurityGroup);
    loadBalancerConstruct.targetGroup.addTarget(new InstanceTarget(ec2Construct.instance));
    const lambdaFunction = createDbUserLambda(this, iamRoleConstruct.lambdaRole, secretsManagerConstruct.secret.secretArn);
  }
}

const app = new cdk.App();
new BMOWPStack(app, 'BMOWPStackId', {
  env: {
    account: config.AWS_ACCOUNT_NUMBER,
    region: config.AWS_REGION
  }
});
