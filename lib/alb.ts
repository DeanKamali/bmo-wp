import { Construct } from 'constructs';
import { aws_elasticloadbalancingv2 as elbv2, aws_ec2 as ec2, CfnOutput } from 'aws-cdk-lib';

export class LoadBalancerConstruct extends Construct {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly listener: elbv2.ApplicationListener;
  public readonly targetGroup: elbv2.ApplicationTargetGroup;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc, ec2SecurityGroup: ec2.ISecurityGroup) {
    super(scope, id);

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true,
      securityGroup: ec2SecurityGroup,
    });

    // Create a target group 
    this.targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 80,
      targetType: elbv2.TargetType.INSTANCE,
    });

 
    this.listener = this.loadBalancer.addListener('Listener80', { 
      port: 80,
      defaultAction: elbv2.ListenerAction.forward([this.targetGroup]),
    });

    // Output the DNS name 
    new CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
    });
  }
}
