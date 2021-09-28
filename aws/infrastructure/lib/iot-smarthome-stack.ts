import { Construct, Stack, StackProps, Duration, CfnOutput } from '@aws-cdk/core';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as path from 'path';
import * as s3 from '@aws-cdk/aws-s3';

export class IotSmarthomeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    let iotBucket = new s3.Bucket(this, 'smarthome-iot-bucket', {
    })

    let iotHandler = new NodejsFunction(this, 'iotIngestFunction', {
      memorySize: 128,
      timeout: Duration.seconds(20),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler',
      entry: path.join(__dirname, `/../lambda/iotHandler.js`),
      environment: {
        "BUCKET_NAME": iotBucket.bucketName
      }
    });

    let api = new apigw.RestApi(this, "iot-api", {
      restApiName: "Iot Ingest API",
      description: "AdfSM API Gateway"
    });

    let iotHandlerIntegration = new apigw.LambdaIntegration(iotHandler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    api.root.addMethod("POST", iotHandlerIntegration);

    api.addApiKey('iot-api-key');
    iotBucket.grantPut(iotHandler);
  }
}
