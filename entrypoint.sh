#!/bin/bash
set -e

echo "============================================================"
echo " Starting Basic CRM Backend Services Container on Render"
echo "============================================================"

# Common JVM memory options tuned for container environments
JAVA_OPTS="-XX:+UseSerialGC -Xss256k -Xms32m -Xmx110m -Dfile.encoding=UTF-8"

# 1. Start Eureka Discovery Service
echo "-> Starting Eureka Discovery Service (Port 8761)..."
java $JAVA_OPTS -jar /app/discovery-service.jar > /app/discovery-service.log 2>&1 &

# Wait for Eureka to be up
echo "-> Waiting for Eureka to initialize..."
for i in $(seq 1 30); do
  if curl -s http://localhost:8761/actuator/health | grep -q "UP"; then
    echo "   Eureka is UP!"
    break
  fi
  sleep 2
done

# 2. Start Core Domain Microservices in parallel
echo "-> Starting Business Microservices..."
java $JAVA_OPTS -jar /app/auth-service.jar > /app/auth-service.log 2>&1 &
java $JAVA_OPTS -jar /app/user-service.jar > /app/user-service.log 2>&1 &
java $JAVA_OPTS -jar /app/lead-service.jar > /app/lead-service.log 2>&1 &
java $JAVA_OPTS -jar /app/customer-service.jar > /app/customer-service.log 2>&1 &
java $JAVA_OPTS -jar /app/task-service.jar > /app/task-service.log 2>&1 &
java $JAVA_OPTS -jar /app/followup-service.jar > /app/followup-service.log 2>&1 &
java $JAVA_OPTS -jar /app/pipeline-service.jar > /app/pipeline-service.log 2>&1 &
java $JAVA_OPTS -jar /app/analytics-service.jar > /app/analytics-service.log 2>&1 &
java $JAVA_OPTS -jar /app/contact-service.jar > /app/contact-service.log 2>&1 &
java $JAVA_OPTS -jar /app/call-service.jar > /app/call-service.log 2>&1 &
java $JAVA_OPTS -jar /app/communication-service.jar > /app/communication-service.log 2>&1 &
java $JAVA_OPTS -jar /app/product-service.jar > /app/product-service.log 2>&1 &
java $JAVA_OPTS -jar /app/activity-service.jar > /app/activity-service.log 2>&1 &
java $JAVA_OPTS -jar /app/appointment-service.jar > /app/appointment-service.log 2>&1 &

# Wait a short moment for microservices to register
echo "-> Giving microservices time to register with Eureka..."
sleep 15

# 3. Start API Gateway as the primary foreground process
echo "============================================================"
echo " Starting API Gateway on Port ${PORT:-8080}..."
echo " All services running and routed via API Gateway"
echo "============================================================"
exec java -XX:+UseSerialGC -Xss256k -Xms48m -Xmx150m -Dfile.encoding=UTF-8 -jar /app/api-gateway.jar
