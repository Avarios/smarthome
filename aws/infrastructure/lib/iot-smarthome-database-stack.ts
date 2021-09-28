// import { Construct, Stack, StackProps, Duration, CfnOutput, } from '@aws-cdk/core';
// import * as apigw from '@aws-cdk/aws-apigateway';
// import * as lambda from '@aws-cdk/aws-lambda';
// import * as dyndb from '@aws-cdk/aws-dynamodb';
// import * as firehose from '@aws-cdk/aws-kinesisfirehose';
// import * as firehoseDestinations from '@aws-cdk/aws-kinesisfirehose-destinations'
// import * as kinesis from '@aws-cdk/aws-kinesis';
// import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
// import * as path from 'path';
// import * as s3 from '@aws-cdk/aws-s3';

// export class IotSmarthomeStack extends Stack {
//   constructor(scope: Construct, id: string, props?: StackProps) {
//     super(scope, id, props);

//     let iotBucket = new s3.Bucket(this, 'myIotBucket', {
//     })

//     let stream = new kinesis.Stream(this,'iotDataStream', {
//       streamName: 'iotdatastream'
//     });

//     let firehoseStream = new firehose.DeliveryStream(this,'iotdatastream',{
//       destinations: [new firehoseDestinations.S3Bucket(iotBucket)],
//       sourceStream:stream
//     });

//     let table = new dyndb.Table(this, 'iotdata', {
//       partitionKey: { name: 'id', type: dyndb.AttributeType.STRING },
//       kinesisStream: stream
//     });

//     let iotHandler = new NodejsFunction(this, 'iotIngestFunction', {
//       memorySize: 256,
//       timeout: Duration.seconds(20),
//       runtime: lambda.Runtime.NODEJS_14_X,
//       handler: 'handler',
//       entry: path.join(__dirname, `/../lambda/iotToRdsHandler.js`),
//       environment: {
//         "TABLE_NAME": table.tableName
//       }
//     });

//     table.grantReadWriteData(iotHandler);
//     table.grantReadData(firehoseStream);
//     iotBucket.grantReadWrite(firehoseStream);
//     stream.grantRead(firehoseStream);

//     let api = new apigw.RestApi(this, "iot-api", {
//       restApiName: "Iot Ingest API",
//       description: "AdfSM API Gateway"
//     });

//     let iotHandlerIntegration = new apigw.LambdaIntegration(iotHandler, {
//       requestTemplates: { "application/json": '{ "statusCode": "200" }' }
//     });

//     api.root.addMethod("POST", iotHandlerIntegration);

//     api.addApiKey('iot-api-key');
//   }
// }
