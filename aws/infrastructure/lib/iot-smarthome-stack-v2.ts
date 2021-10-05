import { Construct, Stack, StackProps, Duration, RemovalPolicy } from '@aws-cdk/core';
import { RestApi, LambdaIntegration, UsagePlan, Period, Stage, Deployment } from '@aws-cdk/aws-apigateway';
import { Runtime } from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { DeliveryStream } from '@aws-cdk/aws-kinesisfirehose';
import { S3Bucket } from '@aws-cdk/aws-kinesisfirehose-destinations';
import { CfnCrawler, Database } from '@aws-cdk/aws-glue';
import { Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import { Role, ServicePrincipal, PolicyDocument, PolicyStatement, Effect, ManagedPolicy } from '@aws-cdk/aws-iam';
import { join } from 'path';

export class SmarthomeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    let iotBucket = new Bucket(this, 'smarthome-iot-bucket', {
      removalPolicy: RemovalPolicy.DESTROY
    });

    let iotDeliveryStream = new DeliveryStream(this, 'SmarthomeDeliveryStream', {
      destinations: [new S3Bucket(iotBucket)]
    });

    let glueDatabase = new Database(this, 'iotSmartHomeData', {
      databaseName: 'iotsmarthomedata'
    });

    let crawlerRole = this.getCrawlerRole(iotBucket.bucketArn, glueDatabase.databaseArn);
    let crawler = this.getGlueCrawler(iotBucket.bucketName, glueDatabase.databaseName, crawlerRole.roleArn);

    let apigw = this.getApiGateway();
    let iotHandler = this.getIotLambdaFunction(iotDeliveryStream.deliveryStreamName);

    let iotHandlerIntegration = new LambdaIntegration(iotHandler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    apigw.root.addMethod("POST", iotHandlerIntegration, {
      apiKeyRequired: true
    });

    iotDeliveryStream.grantPutRecords(iotHandler);
    iotBucket.grantReadWrite(iotDeliveryStream);
    iotBucket.grantReadWrite(crawlerRole);
  }

  getCrawlerPolicyDocument = (bucketArn: string, glueDatabaseArn: string): PolicyDocument => {
    let crawlerS3BucketStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "s3:PutObject",
        "s3:GetObject"
      ],
      resources: [
        bucketArn
      ]
    });

    let crawlerDatabaseStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "glue:*"
      ],
      resources: [
        glueDatabaseArn
      ]
    })

    return new PolicyDocument({
      statements: [
        crawlerS3BucketStatement,
        crawlerDatabaseStatement
      ]
    });
  };

  getIotLambdaFunction = (firehoseStream: string): NodejsFunction => {
    return new NodejsFunction(this, 'iotIngestFunction', {
      memorySize: 128,
      timeout: Duration.seconds(20),
      runtime: Runtime.NODEJS_14_X,
      handler: 'handler',
      entry: join(__dirname, `/../lambda/iotIngesthandler.js`),
      environment: {
        "FIREHOSE_STREAM": firehoseStream
      }
    });
  };

  getApiGateway = (): RestApi => {
    let iotIngestApi = new RestApi(this, "iot-api", {
      restApiName: "Iot Ingest API",
      description: "AdfSM API Gateway"
    });

    let iotIngestApiKey = iotIngestApi.addApiKey('iotIngestKey');
    let apiUsagePlan = new UsagePlan(this, 'iotIngestUsagePlan', {
      quota: {
        limit: 1000000,
        period: Period.DAY
      },
      apiStages: [
        { api: iotIngestApi, stage: iotIngestApi.deploymentStage }
      ]
    });

    apiUsagePlan.addApiKey(iotIngestApiKey)
    return iotIngestApi;
  };

  getCrawlerRole = (bucketArn: string, databaseArn: string): Role => {
    let policy = this.getCrawlerPolicyDocument(bucketArn, databaseArn)
    let crawlerRole = new Role(this, 'iotDataCrawlerRole', {
      assumedBy: new ServicePrincipal('glue.amazonaws.com'),
      description: ' Glue Crawler role to gather iot smarthome data',
      inlinePolicies: {
        policy
      },
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole')
      ]
    });
    return crawlerRole;
  }

  getGlueCrawler = (bucketName: string, glueDatabaseName: string, crawlerRoleArn: string): CfnCrawler => {
    let glueCrawler = new CfnCrawler(this, 'iotDataCrawler', {
      role: crawlerRoleArn,
      targets: {
        s3Targets: [
          {
            path: bucketName
          }
        ]
      },
      databaseName: glueDatabaseName,
      schedule: {
        scheduleExpression: "cron(*/10 * * * ? *)"
      }
    });

    return glueCrawler;
  };

}
