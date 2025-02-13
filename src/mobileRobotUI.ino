#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>

const char* ssid = "7duuProduction_2.4G";
const char* password = "xxxxxxxx";

AsyncWebServer server(80);

void setup() {
  Serial.begin(115200);
  
  // เชื่อมต่อ WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi!");

  // เริ่ม SPIFFS เพื่อเก็บไฟล์เว็บ
  if (!SPIFFS.begin(true)) {
    Serial.println("An error occurred while mounting SPIFFS");
    return;
  }

  // เสิร์ฟไฟล์ index.html เป็นหน้าแรก
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/index.html", "text/html");
  });

  // เสิร์ฟไฟล์ JavaScript และ CSS
  server.on("/script.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/script.js", "application/javascript");
  });

  server.on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/style.css", "text/css");
  });

  // เริ่มเซิร์ฟเวอร์
  server.begin();
}

void loop() {
}
