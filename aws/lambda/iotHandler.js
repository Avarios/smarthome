// asset-input/lambda/iotHandler.js
var AWS = require("aws-sdk");
var bucket = process.env.BUCKET_NAME;

var handler = async (event, context, callback) => {
  console.log(event);
  let fileId = `${makeid(8)}.json`;
  let s3 = new AWS.S3({
    apiVersion: "latest"
  });

  try {
    await s3.putObject({
      Bucket: bucket,
      Key: fileId,
      Body: JSON.parse(event.body),
      ContentType: "application/json; charset=utf-8"
    }).promise();
    let response = {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        fileName: fileId,
        message: ""
      }) ,
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
    callback(error);
  }
};

function makeid(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

exports.handler = handler;