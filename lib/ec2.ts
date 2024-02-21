import { Construct } from 'constructs';
import { aws_ec2 as ec2, aws_iam as iam, CfnOutput, aws_secretsmanager as secretsmanager } from 'aws-cdk-lib';

export class Ec2Construct extends Construct {
  public readonly instance: ec2.Instance;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc, role: iam.IRole, securityGroup: ec2.ISecurityGroup, secret: secretsmanager.ISecret) {
    super(scope, id);

    const userDataScript = `#!/bin/bash
    yum update -y
    yum install -y httpd php php-mysqlnd aws-cli jq
    systemctl start httpd
    systemctl enable httpd
    cd /var/www/html
    wget https://wordpress.org/latest.tar.gz
    tar -xzf latest.tar.gz
    mv wordpress/* .
    rm -rf wordpress latest.tar.gz
    cp wp-config-sample.php wp-config.php

    # Retrieve secret values using AWS CLI
    SECRET=$(aws secretsmanager get-secret-value --secret-id ${secret.secretArn} --region YOUR_REGION --query SecretString --output text)
    DB_NAME=$(echo $SECRET | jq -r .dbname)
    DB_USER=$(echo $SECRET | jq -r .username)
    DB_PASSWORD=$(echo $SECRET | jq -r .password)
    DB_HOST=$(echo $SECRET | jq -r .host)

    sed -i 's/database_name_here/'"$DB_NAME"'/g' wp-config.php
    sed -i 's/username_here/'"$DB_USER"'/g' wp-config.php
    sed -i 's/password_here/'"$DB_PASSWORD"'/g' wp-config.php
    sed -i 's/localhost/'"$DB_HOST"'/g' wp-config.php

    chown apache:apache * -R
    chmod 400 wp-config.php
    `;

    
    const userData = ec2.UserData.custom(userDataScript);

    this.instance = new ec2.Instance(this, 'Instance', {
      vpc,
      role,
      securityGroup,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.lookup({
        name: "amzn2-ami-hvm-*-x86_64-ebs",
        owners: ["amazon"]
      }),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      associatePublicIpAddress: true,
      userData: userData, // Add the user data to the instance
    });

    new CfnOutput(this, 'InstanceOutputId', {
      value: this.instance.instanceId
    });

    new CfnOutput(this, 'InstanceOutputPublicDns', {
      value: this.instance.instancePublicDnsName
    });
  }
}
