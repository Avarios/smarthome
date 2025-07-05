#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

const char *ssid = "YourSSID"; // Replace with your WiFi SSID
const char *password = "YourPassword"; // Replace with your WiFi password
const char *mqtt_server = "mqtt.example.com"; // Replace with your MQTT server address
const char *ID = "SENSOR_ID"; // Replace with your sensor ID
const int dry = 2955;       // Adjusted dry value, please calibrate according to your sensor
const int wet = 930;        // Adjusted wet value, please calibrate according to your sensor
const int sleepMinutes = 60; // Sleep time in minutes, adjust as needed

WiFiClient espClient;
PubSubClient client(espClient);

void setup()
{
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  printf("Connecting to WiFi...\n");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
  }

  printf("Connected to WiFi\n");
  printf("IP address: %s\n", WiFi.localIP().toString().c_str());
  printf("Connecting to MQTT server...\n");
  client.setServer(mqtt_server, 1883);

  if (client.connect("ESP32Client"))
  {
    int sensorValue = analogRead(D1);
    float percentage = (float)(dry - sensorValue) / (dry - wet) * 100;
    if (percentage < 0)
      percentage = 0;
    if (percentage > 100)
      percentage = 100;
    printf("Sensor value: %d\n", sensorValue);
    printf("Sensor value: %f\n", percentage);
    String payload = "{\"value\":" + String(sensorValue) + " ,\"percentage\":" + String(percentage, 2) + "}";
    String topic = String("adfhome/moisture/") + ID;

    printf("Sensor value: %d\n", sensorValue);
    printf("Publishing JSON: %s\n", payload.c_str());
    client.publish(topic.c_str(), payload.c_str());
    delay(1000);
  }

  printf("Going to sleep for %d minutes...\n", sleepMinutes);
  esp_sleep_enable_timer_wakeup(sleepMinutes * 60 * 1000000ULL);
  esp_deep_sleep_start();
}
void loop()
{
  /* int sensorValue = analogRead(D1); // oder dein entsprechender Pin


float percentage = (float)(dry - sensorValue) / (dry - wet) * 100;

// Begrenzen auf 0-100%
if (percentage < 0) percentage = 0;
if (percentage > 100) percentage = 100;
printf("Sensor value: %d\n", sensorValue);
printf("Sensor value: %f\n", percentage);
delay(5000); // Sleep for 1 second to simulate periodic reading
*/
}