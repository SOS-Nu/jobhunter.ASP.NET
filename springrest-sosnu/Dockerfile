# Stage 1: Build the application
FROM gradle:8.7-jdk17 AS build
COPY --chown=gradle:gradle . /hoidanit/JobZone
WORKDIR /hoidanit/JobZone

#skip task: test
RUN gradle clean build -x test --no-daemon

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-alpine
EXPOSE 8080
COPY --from=build /hoidanit/JobZone/build/libs/*.jar /hoidanit/spring-boot-job-hunter.jar
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /hoidanit/spring-boot-job-hunter.jar"]
