import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';

export class SecurityGroupConstruct extends Construct {
  public readonly ec2SecurityGroup: ec2.ISecurityGroup;
  public readonly rdsSecurityGroup: ec2.ISecurityGroup;
  public readonly albSecurityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc) {
    super(scope, id);

    // Security Group for EC2 Instances
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'EC2-SG',
    });

    // Security Group for RDS Database
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'RDS-SG',
    });

    // Security Group for ALB
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'ALB-SG',
    });

    // Allow SSH, HTTP, and HTTPS access from the Internet to EC2 instances
    this.ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allows SSH access from the Internet');
    this.ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allows HTTP access from the Internet');
    this.ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allows HTTPS access from the Internet');

    // Allow HTTP access from the ALB to the EC2 instances
    // Note: This now uses the ALB's security group created above.
    this.ec2SecurityGroup.addIngressRule(this.albSecurityGroup, ec2.Port.tcp(80), 'Allows HTTP access from the ALB');

    // Allow EC2 instances to communicate with the RDS database
    this.rdsSecurityGroup.addIngressRule(this.ec2SecurityGroup, ec2.Port.tcp(5432), 'Allow PostgreSQL connections from EC2 instances');

    // Allow incoming HTTP traffic to the ALB from anywhere
    this.albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic to ALB');
  }
}
