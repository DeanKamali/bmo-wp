import { Construct } from 'constructs';
import { aws_iam as iam } from 'aws-cdk-lib';

export class IamRoleConstruct extends Construct {
  public readonly role: iam.IRole;
  public readonly lambdaRole: iam.IRole; 

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Existing EC2 Role
    this.role = new iam.Role(this, 'bmo-wp-role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // New Lambda Role with full RDS access and Secrets Manager access
    this.lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSFullAccess'), 
        iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'), 
      ],
    });
  }
}
