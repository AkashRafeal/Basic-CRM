Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       Starting Basic CRM Cloud Microservices" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "[1/13] Starting Discovery Service (Eureka Server on :8761)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\discovery-service`" && mvn spring-boot:run" -WindowStyle Normal
Start-Sleep -Seconds 10

Write-Host "[2/13] Starting API Gateway (:8080)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\api-gateway`" && mvn spring-boot:run" -WindowStyle Normal
Start-Sleep -Seconds 6

Write-Host "[3/13] Starting Auth Service (:8081)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\auth-service`" && mvn spring-boot:run" -WindowStyle Normal

Write-Host "[4/13] Starting User Service (:8082)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\user-service`" && mvn spring-boot:run" -WindowStyle Normal

Write-Host "[5/13] Starting Lead Service (:8083)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\lead-service`" && mvn spring-boot:run" -WindowStyle Normal

Write-Host "[6/13] Starting Customer Service (:8084)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\customer-service`" && mvn spring-boot:run" -WindowStyle Normal

Write-Host "[7/13] Starting Task Service (:8085)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\task-service`" && mvn spring-boot:run" -WindowStyle Normal

Write-Host "[8/13] Starting Follow-Up Service (:8086)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\followup-service`" && mvn spring-boot:run" -WindowStyle Normal

Write-Host "[9/13] Starting Pipeline Service (:8087)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\pipeline-service`" && mvn spring-boot:run" -WindowStyle Normal

Write-Host "[10/13] Starting Analytics Service (:8088)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\analytics-service`" && mvn spring-boot:run" -WindowStyle Normal

Write-Host "[11/13] Starting Contact Service (:8089)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\contact-service`" && mvn spring-boot:run" -WindowStyle Normal

Write-Host "[12/17] Starting Call Service (:8090)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\call-service`" && mvn spring-boot:run" -WindowStyle Normal

Write-Host "[13/17] Starting Communication Service (:8091)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\communication-service`" && mvn spring-boot:run" -WindowStyle Normal

Write-Host "[14/17] Starting Product Service (:8092)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\product-service`" && mvn spring-boot:run" -WindowStyle Normal

Write-Host "[15/17] Starting Activity Service (:8093)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\activity-service`" && mvn spring-boot:run" -WindowStyle Normal

Write-Host "[16/17] Starting Appointment Service (:8094)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend\appointment-service`" && mvn spring-boot:run" -WindowStyle Normal

Write-Host "[17/17] Starting Frontend (React + Vite on :5173)..." -ForegroundColor Magenta
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\frontend`" && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  All Basic CRM microservices and frontend launched!" -ForegroundColor Cyan
Write-Host "  Frontend:         http://localhost:5173" -ForegroundColor White
Write-Host "  API Gateway:      http://localhost:8080" -ForegroundColor White
Write-Host "  Eureka Discovery: http://localhost:8761" -ForegroundColor White
Write-Host "  Database:         Supabase PostgreSQL (Connected)" -ForegroundColor Green
Write-Host "  Swagger UI:       http://localhost:8080/swagger-ui.html" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
