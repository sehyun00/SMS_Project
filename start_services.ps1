# 스프링 서버 실행
Start-Process powershell -ArgumentList "-NoExit", "cd ./Back/Spring/Rebalancing; .\gradlew.bat bootrun"

# CODEF API 서버 실행
Start-Process powershell -ArgumentList "-NoExit", "cd ./Back/CODEF_API/; python ./testflask.py"

# 딥러닝 서버 실행
Start-Process powershell -ArgumentList "-NoExit", "cd ./Back/DeepLearning; python ./server.py"

# Expo 서버 실행
Start-Process powershell -ArgumentList "-NoExit", "cd ./Front/ReactNative; npm start -c"

Write-Host "모든 서비스가 시작되었습니다." 