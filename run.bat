cd rest
start  cmd /k "npm start" >>run.log
cd ../admin 
start  cmd /k "pnpm start" >>run.log
cd ../gameroomkiosk

start  cmd /k "pnpm start" >>run.log

pause