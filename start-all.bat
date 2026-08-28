@echo off
title Basic CRM - Full Stack Launch Manager
echo ========================================================
echo        Starting Basic CRM Cloud Microservices
echo ========================================================

echo [1/13] Starting Discovery Service (Eureka Server on :8761)...
start "Discovery Service (8761)" cmd /k "cd /d backend\discovery-service && mvn spring-boot:run"
timeout /t 10 /nobreak >nul

echo [2/13] Starting API Gateway (Spring Cloud Gateway on :8080)...
start "API Gateway (8080)" cmd /k "cd /d backend\api-gateway && mvn spring-boot:run"
timeout /t 6 /nobreak >nul

echo [3/13] Starting Auth Service (:8081)...
start "Auth Service (8081)" cmd /k "cd /d backend\auth-service && mvn spring-boot:run"

echo [4/13] Starting User Service (:8082)...
start "User Service (8082)" cmd /k "cd /d backend\user-service && mvn spring-boot:run"

echo [5/13] Starting Lead Service (:8083)...
start "Lead Service (8083)" cmd /k "cd /d backend\lead-service && mvn spring-boot:run"

echo [6/13] Starting Customer Service (:8084)...
start "Customer Service (8084)" cmd /k "cd /d backend\customer-service && mvn spring-boot:run"

echo [7/13] Starting Task Service (:8085)...
start "Task Service (8085)" cmd /k "cd /d backend\task-service && mvn spring-boot:run"

echo [8/13] Starting Follow-Up Service (:8086)...
start "Follow-Up Service (8086)" cmd /k "cd /d backend\followup-service && mvn spring-boot:run"

echo [9/13] Starting Sales Pipeline Service (:8087)...
start "Pipeline Service (8087)" cmd /k "cd /d backend\pipeline-service && mvn spring-boot:run"

echo [10/13] Starting Analytics & Reports Service (:8088)...
start "Analytics Service (8088)" cmd /k "cd /d backend\analytics-service && mvn spring-boot:run"

echo [11/13] Starting Contact Management Service (:8089)...
start "Contact Service (8089)" cmd /k "cd /d backend\contact-service && mvn spring-boot:run"

echo [12/17] Starting Call Management Service (:8090)...
start "Call Service (8090)" cmd /k "cd /d backend\call-service && mvn spring-boot:run"

echo [13/17] Starting Communication Management Service (:8091)...
start "Communication Service (8091)" cmd /k "cd /d backend\communication-service && mvn spring-boot:run"

echo [14/17] Starting Product Management Service (:8092)...
start "Product Service (8092)" cmd /k "cd /d backend\product-service && mvn spring-boot:run"

echo [15/17] Starting Activity & Notes Service (:8093)...
start "Activity Service (8093)" cmd /k "cd /d backend\activity-service && mvn spring-boot:run"

echo [16/17] Starting Appointment & Notification Service (:8094)...
start "Appointment Service (8094)" cmd /k "cd /d backend\appointment-service && mvn spring-boot:run"

echo [17/17] Starting Frontend (React + Vite on :5173)...
start "CRM Frontend (5173)" cmd /k "cd /d frontend && npm run dev"

echo.
echo ========================================================
echo   All Basic CRM microservices and frontend launched!
echo   Frontend UI: http://localhost:5173
echo   API Gateway: http://localhost:8080
echo   Eureka Discovery: http://localhost:8761
echo   Database: Supabase PostgreSQL (Connected)
echo   Swagger UI: http://localhost:8080/swagger-ui.html
echo ========================================================
pause
