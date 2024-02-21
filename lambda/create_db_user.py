import boto3
import json
import os
import psycopg2

def lambda_handler(event, context):
    secrets_client = boto3.client('secretsmanager')

    secret_arn = os.environ.get('SECRET_ARN')
    if not secret_arn:
        return {
            'statusCode': 400,
            'body': json.dumps('SECRET_ARN environment variable is required but was not provided.')
        }

    try:
        get_secret_value_response = secrets_client.get_secret_value(SecretId=secret_arn)
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps('Failed to retrieve secret value from Secrets Manager.')
        }

    secret = json.loads(get_secret_value_response['SecretString'])

    db_host = secret['host']
    db_user = secret['username']
    db_pass = secret['password']
    db_name = "wordpress"

    admin_conn = None
    user_conn = None
    try:
        admin_conn = psycopg2.connect(dbname="postgres", user=db_user, password=db_pass, host=db_host)
        admin_conn.autocommit = True
        with admin_conn.cursor() as cursor:
            cursor.execute("SELECT 1 FROM pg_database WHERE datname=%s", (db_name,))
            if cursor.fetchone() is None:
                cursor.execute(f"CREATE DATABASE {db_name}")

        user_conn = psycopg2.connect(dbname=db_name, user=db_user, password=db_pass, host=db_host)
        with user_conn.cursor() as cursor:
            # Perform actual database operations here

             return {
            'statusCode': 200,
            'body': json.dumps('Database and user setup completed.')
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error: {str(e)}")
        }
    finally:
        if admin_conn:
            admin_conn.close()
        if user_conn:
            user_conn.close()
