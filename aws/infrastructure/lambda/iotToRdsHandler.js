const aws = require('aws-sdk');
const tableName = process.env.TABLE_NAME;

exports.handler = async (event, context, callback) => {
  console.log(`Entering event with data: ${JSON.stringify(event)}`);
  let docClient = new aws.DynamoDB.DocumentClient({ apiVersion: 'latest' });
  try {
    const body = event.body;
    console.log(`Got Body : ${body}`);
    console.log(`ID : ${body.sensorId}`);
    const putParams = {
      Item: {
        id: body.sensorId,
        time: body.time,
        total: body.total,
        power:  body.power ,
        current: body.current
      },
      TableName: tableName
    };
    console.log(`Putting Item with Params: ${JSON.stringify(putParams.Item)}`);
    let result = await docClient.put(putParams).promise();
    let response = {
      "statusCode": 200,
      "body": JSON.stringify(result),
      "headers": {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      }
    };
    console.log("Added item:", JSON.stringify(response, null, 2));
    callback(null, response);

  } catch (error) {
    let response = {
      "statusCode": 500,
      "body": JSON.stringify(error),
      "headers": {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      }
    };
    callback(error, response);
  }
}