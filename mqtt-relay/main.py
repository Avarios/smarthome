from paho.mqtt import client as mqtt_client
import requests
import json

broker = '192.168.50.225'
port = 1883
topic = 'adfsmarthome/+/SENSOR'
api_url ='https://37r2lne909.execute-api.eu-central-1.amazonaws.com/prod/'
api_key = 'VyZNbNWN8Z6I21cNVfn7V7JwEFo4muFY2d1vqgcV'

def connect_broker() -> mqtt_client:
    def on_connect(client,userdata,flags,rc):
        if rc == 0:
            print("Connected to: {}".format(broker))
        else:
            print("Failed to connect, return code {}\n".format(rc))
    client = mqtt_client.Client('mqtt-relay')
    client.on_connect = on_connect
    client.connect(broker,port=port,clean_start=mqtt_client.MQTT_CLEAN_START_FIRST_ONLY)
    return client

def send_iot_data(data):
    print(f"Saving `{data}`")
    r = requests.post(api_url,json=data)
    r.headers['x-api-key'] = api_key
    print(r.text)
    # add error handling

def subscribe(client: mqtt_client):
    def on_message(client, userdata, msg):
        mqttPayload = json.loads(msg.payload.decode())
        splitted = msg.topic.split('/')
        mqttPayload['sensorId'] = splitted[1]
        
        payload = json.dumps(mqttPayload,indent=4)
        print(f"Received data from `{msg.topic}` topic")
        print('{}',payload )
        send_iot_data(payload)

    client.subscribe(topic)
    client.on_message = on_message

def run():
    client = connect_broker()
    subscribe(client=client)
    client.loop_forever()

if __name__ == '__main__':
    run()