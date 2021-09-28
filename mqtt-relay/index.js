const mqtt = require('mqtt')
const request = require('request');
const client = mqtt.connect('mqtt://192.168.50.225:1883')
const apiUrl = 'https://u4u945u70c.execute-api.eu-central-1.amazonaws.com/prod/'

client.on('connect', () => {
    console.log(`connected to Server`)
    client.subscribe('adfsmarthome/+/SENSOR')
});

client.on('message', (topic, message) => {
    let mqttMessage = JSON.parse(message);
    console.log(mqttMessage)
    let id = topic.split('/')[1];
    let requestBody = {
        "sensorId": id,
        "time": mqttMessage.Time,
        "total": mqttMessage.ENERGY.Total,
        "power": mqttMessage.ENERGY.Power,
        "current": mqttMessage.ENERGY.Current,
    };
    request.post(apiUrl, {
        body: JSON.stringify(requestBody),
    }, (error, response) => {
        if (error) {
            console.error(error);
        } else {
            console.log(response.statusCode);
        }
    })
});