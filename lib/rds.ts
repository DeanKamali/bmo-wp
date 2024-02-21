import { Construct } from 'constructs';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { aws_rds as rds, aws_ec2 as ec2, Duration, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';

export class RdsConstruct extends Construct {
  public readonly dbInstance: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc, securityGroup: ec2.ISecurityGroup, secret: ISecret) {
    super(scope, id);

    this.dbInstance = new rds.DatabaseInstance(this, 'RDSInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_12_17,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: vpc,
      credentials: rds.Credentials.fromSecret(secret),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [securityGroup],
      multiAz: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      deleteAutomatedBackups: true,
      backupRetention: Duration.days(7),
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    // Output the RDS instance endpoint
    new CfnOutput(this, 'RDSInstanceEndpoint', {
      value: this.dbInstance.dbInstanceEndpointAddress,
    });

    // Output the RDS instance port
    new CfnOutput(this, 'RDSInstancePort', {
      value: this.dbInstance.dbInstanceEndpointPort,
    });
  }
}
