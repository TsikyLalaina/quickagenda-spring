# Stage 1: Build the JAR
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Stage 2: Run the JAR in a slim image
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# Add this line to limit JVM memory
ENV JAVA_OPTS="-Xmx192m -Xms128m"
ENTRYPOINT ["java", "-jar", "/app/app.jar"]