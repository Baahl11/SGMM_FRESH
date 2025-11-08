# PowerShell script to apply migration 006
# Run: .\apply-migration-006.ps1

Write-Host "🔌 Applying migration 006: user_sms_credentials..." -ForegroundColor Cyan

# Load .env.local variables
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$PGHOST = $env:POSTGRES_HOST
if (-not $PGHOST) { $PGHOST = "localhost" }

$PGPORT = $env:POSTGRES_PORT
if (-not $PGPORT) { $PGPORT = "5432" }

$PGDATABASE = $env:POSTGRES_DATABASE
if (-not $PGDATABASE) { $PGDATABASE = "agendamedpro" }

$PGUSER = $env:POSTGRES_USER
if (-not $PGUSER) { $PGUSER = "postgres" }

$PGPASSWORD = $env:POSTGRES_PASSWORD
if (-not $PGPASSWORD) { $PGPASSWORD = "admin" }

Write-Host "Database: $PGDATABASE @ $PGHOST:$PGPORT" -ForegroundColor Gray

# Set PGPASSWORD environment variable for psql
$env:PGPASSWORD = $PGPASSWORD

# Apply migration
$migrationFile = "vercel-migration\migrations\006_add_user_sms_credentials.sql"

if (Test-Path $migrationFile) {
    Write-Host "📋 Reading migration file..." -ForegroundColor Yellow
    
    psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f $migrationFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
        
        # Verify table
        Write-Host "`n📊 Verifying table structure..." -ForegroundColor Cyan
        $query = @"
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_sms_credentials'
ORDER BY ordinal_position;
"@
        
        Write-Output $query | psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE
        
        Write-Host "`n✨ All done!" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}
