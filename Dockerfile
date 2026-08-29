# =========================================================================
# Stage 1: Build All Backend Microservices
# =========================================================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

# Copy backend pom and sources
COPY backend/pom.xml ./
COPY backend/discovery-service/pom.xml ./discovery-service/
COPY backend/api-gateway/pom.xml ./api-gateway/
COPY backend/auth-service/pom.xml ./auth-service/
COPY backend/user-service/pom.xml ./user-service/
COPY backend/lead-service/pom.xml ./lead-service/
COPY backend/customer-service/pom.xml ./customer-service/
COPY backend/task-service/pom.xml ./task-service/
COPY backend/followup-service/pom.xml ./followup-service/
COPY backend/pipeline-service/pom.xml ./pipeline-service/
COPY backend/analytics-service/pom.xml ./analytics-service/
COPY backend/contact-service/pom.xml ./contact-service/
COPY backend/call-service/pom.xml ./call-service/
COPY backend/communication-service/pom.xml ./communication-service/
COPY backend/product-service/pom.xml ./product-service/
COPY backend/activity-service/pom.xml ./activity-service/
COPY backend/appointment-service/pom.xml ./appointment-service/

# Copy all source directories
COPY backend/discovery-service/src ./discovery-service/src
COPY backend/api-gateway/src ./api-gateway/src
COPY backend/auth-service/src ./auth-service/src
COPY backend/user-service/src ./user-service/src
COPY backend/lead-service/src ./lead-service/src
COPY backend/customer-service/src ./customer-service/src
COPY backend/task-service/src ./task-service/src
COPY backend/followup-service/src ./followup-service/src
COPY backend/pipeline-service/src ./pipeline-service/src
COPY backend/analytics-service/src ./analytics-service/src
COPY backend/contact-service/src ./contact-service/src
COPY backend/call-service/src ./call-service/src
COPY backend/communication-service/src ./communication-service/src
COPY backend/product-service/src ./product-service/src
COPY backend/activity-service/src ./activity-service/src
COPY backend/appointment-service/src ./appointment-service/src

# Build JAR artifacts
RUN mvn clean package -DskipTests

# =========================================================================
# Stage 2: Minimal Runtime Image
# =========================================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install bash and curl for orchestrator health checks
RUN apk add --no-cache bash curl procps

# Copy built JARs
COPY --from=builder /workspace/discovery-service/target/discovery-service-*.jar ./discovery-service.jar
COPY --from=builder /workspace/auth-service/target/auth-service-*.jar ./auth-service.jar
COPY --from=builder /workspace/user-service/target/user-service-*.jar ./user-service.jar
COPY --from=builder /workspace/lead-service/target/lead-service-*.jar ./lead-service.jar
COPY --from=builder /workspace/customer-service/target/customer-service-*.jar ./customer-service.jar
COPY --from=builder /workspace/task-service/target/task-service-*.jar ./task-service.jar
COPY --from=builder /workspace/followup-service/target/followup-service-*.jar ./followup-service.jar
COPY --from=builder /workspace/pipeline-service/target/pipeline-service-*.jar ./pipeline-service.jar
COPY --from=builder /workspace/analytics-service/target/analytics-service-*.jar ./analytics-service.jar
COPY --from=builder /workspace/contact-service/target/contact-service-*.jar ./contact-service.jar
COPY --from=builder /workspace/call-service/target/call-service-*.jar ./call-service.jar
COPY --from=builder /workspace/communication-service/target/communication-service-*.jar ./communication-service.jar
COPY --from=builder /workspace/product-service/target/product-service-*.jar ./product-service.jar
COPY --from=builder /workspace/activity-service/target/activity-service-*.jar ./activity-service.jar
COPY --from=builder /workspace/appointment-service/target/appointment-service-*.jar ./appointment-service.jar
COPY --from=builder /workspace/api-gateway/target/api-gateway-*.jar ./api-gateway.jar

# Copy entrypoint runner
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose API Gateway port
EXPOSE 8080

ENTRYPOINT ["/bin/bash", "/app/entrypoint.sh"]
