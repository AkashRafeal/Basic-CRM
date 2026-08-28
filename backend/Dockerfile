# Step 1: Build all Maven modules
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
# Copy all files and submodules
COPY . .
RUN mvn clean package -DskipTests

# Step 2: Run the API Gateway (or main entry service)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copies all built jars into the runner
COPY --from=build /app/*/target/*.jar ./

# Memory tuning for free tier
ENV JAVA_OPTS="-Xms256m -Xmx384m -XX:+UseSerialGC"
EXPOSE 8080

# Starts the gateway / core service (or specify which service JAR to run)
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar $(find . -name '*.jar' | head -n 1)"]
