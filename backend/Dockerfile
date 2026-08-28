# Step 1: Build all modules with Java 21
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Step 2: Run with Java 21 JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/*/target/*.jar ./

ENV JAVA_OPTS="-Xms256m -Xmx384m -XX:+UseSerialGC"
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar $(find . -name '*.jar' | head -n 1)"]
