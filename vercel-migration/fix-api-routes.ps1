# Fix all API routes to use await createClient()
# This PowerShell script updates all API routes in vercel-migration

$apiPath = "c:\Users\gm_me\SGMM_FRESH\vercel-migration\app\api"
$files = Get-ChildItem -Path $apiPath -Recurse -Filter "*.ts" | Where-Object { $_.DirectoryName -notlike "*node_modules*" }

$count = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace: const supabase = createClient() -> const supabase = await createClient()
    $content = $content -replace '(\s+)const supabase = createClient\(\)', '$1const supabase = await createClient()'
    
    # Replace import if needed: from '@/lib/supabase' -> from '@/lib/supabase/server'
    $content = $content -replace "from '@/lib/supabase'", "from '@/lib/supabase/server'"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $count++
        Write-Host "✅ Fixed: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n🎉 Total files fixed: $count" -ForegroundColor Cyan
