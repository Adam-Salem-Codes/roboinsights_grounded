@echo off
echo Packaging RoboInsights VEX Brain Connection Utility...

REM Install pkg globally if not already installed
call npm list -g pkg >nul 2>&1 || (
  echo Installing pkg globally...
  call npm install -g pkg
)

REM Install dependencies if needed
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)

REM Build TypeScript files
echo Building TypeScript files...
call npm run build

REM Create package directory if it doesn't exist
if not exist "dist-pkg" mkdir dist-pkg

REM Create needed directories for serialport binaries
if not exist "dist-pkg\serialport\build\Release" mkdir "dist-pkg\serialport\build\Release"

REM Package the application using pkg
echo Packaging application...
call pkg . --targets node18-win-x64 --output dist-pkg/roboinsights.exe

REM Check if we need to handle native modules
set BINDINGS_PATH=node_modules\@serialport\bindings-cpp\build\Release
if exist %BINDINGS_PATH%\bindings.node (
  echo Copying native serialport binaries...
  copy %BINDINGS_PATH%\bindings.node dist-pkg\serialport\build\Release\
) else (
  echo No serialport bindings found. Your executable may not work with serial ports.
)

echo.
echo =====================================================================
echo Packaging complete! Executable is located in the dist-pkg folder.
echo.
echo NOTE: The packaged application will run in SIMULATION MODE.
echo This means it will not connect to real hardware, but will simulate
echo VEX Brain connections to demonstrate the interface functionality.
echo.
echo To use with real hardware, run the application with 'npm start'
echo instead of using the packaged executable.
echo =====================================================================
echo.