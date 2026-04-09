@echo off
setlocal

cd /d "%~dp0"

echo [1/3] Starting MongoDB service if available...
sc query MongoDB >nul 2>&1
if %errorlevel%==0 (
  net start MongoDB >nul 2>&1
)

echo [2/3] Starting backend server...
start "Property Server" cmd /k "cd /d ""%~dp0server"" && mvn spring-boot:run"

echo [3/3] Starting web admin...
start "Web Admin" cmd /k "cd /d ""%~dp0web-admin"" && npm run dev -- --host 0.0.0.0"

echo.
echo Services are starting.
echo Backend: http://192.168.5.4:8080
echo Web admin: http://192.168.5.4:5173
echo.
echo If you need to stop them, close the opened command windows.
pause
