import { Construct } from 'constructs';
import { aws_secretsmanager as secretsmanager } from 'aws-cdk-lib';

export class SecretsManagerConstruct extends Construct {
  public readonly secret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, secretName: string, username: string = 'dbmaster', wpUsername: string = 'wpuser', wpPassword: string = 'wppass') {
    super(scope, id);

    this.secret = new secretsmanager.Secret(this, secretName, {
      secretName: secretName,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: username, // RDS username
          wpUsername: wpUsername, // WordPress username
          wpPassword: wpPassword // WordPress password
        }),
        generateStringKey: 'password', // for RDS
        excludePunctuation: true,
        includeSpace: false,
      },
    });
  }
}
