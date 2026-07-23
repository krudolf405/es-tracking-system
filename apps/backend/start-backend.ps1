$env:DATABASE_URL='postgres://exam_user:exam_pass@localhost:5432/exam_tracking'
$env:JWT_SECRET='super-secret-jwt-key-min-32-chars-long!!'
$env:JWT_EXPIRATION='24h'
$env:PORT='3000'
$env:FRONTEND_URL='http://localhost:5173'
Set-Location 'C:\Users\Admin\Desktop\ES Tracking System\exam-tracking-system\apps\backend'
npx tsx -e "require('./src/main.ts')"
