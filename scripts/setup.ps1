# Run this once in PowerShell from the expense-tracker folder:
#   .\scripts\setup.ps1

Write-Host "Node version:" (node -v)
Write-Host ""

if (Test-Path .next) { Remove-Item -Recurse -Force .next }
if (Test-Path node_modules\libsql) { Remove-Item -Recurse -Force node_modules\libsql }
if (Test-Path node_modules\@libsql) { Remove-Item -Recurse -Force node_modules\@libsql }

Write-Host "Rebuilding SQLite driver for your Node version..."
npm rebuild better-sqlite3

Write-Host "Generating Prisma client..."
npx prisma generate

Write-Host "Syncing database..."
npx prisma db push

Write-Host ""
Write-Host "Setup complete. Start the app with: npm run dev"
Write-Host "Then open: http://localhost:3000"
