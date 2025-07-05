#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

const char *ssid = "YOUR_SSID";
const char *password = "YOUR  PASSWORD";
const char *mqtt_server = "192.168.68.68";
const char *mqtt_topic = "adfhome/moisture/";
const char *ID = "INDOOR_MOISTURE_SENSOR_01";
const int dry = 2955;       // Adjusted dry value, calibrated for the specific sensor
const int wet = 930;        // Adjusted wet value, calibrated for the specific sensor
const int sleepMinutes = 5; // Sleep time in minutes

WiFiClient espClient;
PubSubClient client(espClient);

// TODO:
//  1. Add error handling for WiFi and MQTT connection failures.
//  2. Add a function to handle incoming MQTT messages for remote control or configuration.
//  3. Add code that checks if Voltage is under 3.3 then put into infinite deep sleep mode.

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
    int sensorValue = analogRead(A1);
    uint32_t Vbatt = 0;
    for (int i = 0; i < 16; i++)
    {
      Vbatt = Vbatt + analogReadMilliVolts(A3); // ADC with correction
    }
    float Vbattf = 2 * Vbatt / 16 / 1000.0; // attenuation ratio 1/2, mV --> V
    
    float percentage = (float)(dry - sensorValue) / (dry - wet) * 100;
    if (percentage < 0)
      percentage = 0;
    if (percentage > 100)
      percentage = 100;
    printf("Sensor value: %d\n", sensorValue);
    printf("Sensor percentage: %f\n", percentage);
    printf("Battery voltage: %f V\n", Vbattf);
    String payload = "{\"value\":" + String(sensorValue) + " ,\"percentage\":" + String(percentage, 2) + ", \"voltage\":" + String(Vbattf, 2) + "}";
    String topic = String(mqtt_topic) + ID;

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
}