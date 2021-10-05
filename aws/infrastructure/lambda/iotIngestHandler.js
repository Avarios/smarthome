// asset-input/lambda/iotHandler.js
const AWS = require("aws-sdk");
const streamName = process.env.FIREHOSE_STREAM;

const handler = async (event, context, callback) => {
  console.log(event);
  let firehose = new AWS.Firehose({
    apiVersion: 'latest'
  })


  try {
    let result = await firehose.putRecord({
      Record: { Data: event.body },
      DeliveryStreamName: streamName
    }).promise();
    console.log(result);
    if(!result.RecordId) {
      throw new Error('No record were generated');
    } 
    let response = {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        recordId: result.RecordId,
        message: 'Ok'
      }),
      isBase64Encoded: false
    };
    callback(null, response);
  } catch (e) {
    let error = {
      statusCode: 500,
      body: {
        success: false,
        fileName: fileId,
        message: e
      },
      isBase64Encoded: false
    };
    console.error(JSON.stringify(error));
    callback(error);
  }
};

exports.handler = handler;
