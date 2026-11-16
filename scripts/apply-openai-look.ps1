param(
    [string]$ImagePath = (Join-Path $PSScriptRoot '../local/openai-dragon/background.png')
)

$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$utf8 = [Text.UTF8Encoding]::new($false)
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$picture = (Resolve-Path -LiteralPath $ImagePath).Path
$dataRoot = Join-Path $env:APPDATA 'Woodfish'
$effectsRoot = Join-Path $dataRoot 'effects'
$installedCli = Join-Path $env:LOCALAPPDATA 'Woodfish/woodfish.js'
$pluginSource = Join-Path $repoRoot 'packages/effects/builtin/openai-startup'
$pluginTarget = Join-Path $effectsRoot 'openai-startup'

if (-not (Test-Path -LiteralPath $installedCli)) {
    throw '未找到已安装的 Woodfish CLI。请先安装 Woodfish，再应用此定制。'
}
foreach ($file in @('effect.js', 'effect.css', 'effect.json', 'README.md')) {
    if (-not (Test-Path -LiteralPath (Join-Path $pluginSource $file))) {
        throw "缺少插件文件：$file"
    }
}

$backup = Join-Path $repoRoot ('local/openai-dragon/backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
foreach ($relative in @('codex.json', 'effects/background/params.json', 'effects/openai-startup')) {
    $original = Join-Path $dataRoot $relative
    if (Test-Path -LiteralPath $original) {
        $destination = Join-Path $backup $relative
        New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
        Copy-Item -LiteralPath $original -Destination $destination -Recurse
    }
}
Write-Output "设置备份：$backup"

# 复用现有 CLI 的内容校验、哈希存储和设置写入；不启动或重启 Codex。
& node $installedCli codex background set $picture
if ($LASTEXITCODE -ne 0) { throw "背景设置失败。此前的设置位于 $backup" }

$backgroundParams = Join-Path $effectsRoot 'background/params.json'
$values = @{}
if (Test-Path -LiteralPath $backgroundParams) {
    $saved = Get-Content -LiteralPath $backgroundParams -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($property in $saved.PSObject.Properties) { $values[$property.Name] = $property.Value }
}
$values['enabled'] = $true
$values['opacity'] = 0.22
$values['mask'] = 0.65
$values['blur'] = 14
$values['saturate'] = 110
$values['luminosity'] = 0.06
$values['size'] = 'cover'
$values['position'] = 'center'
[IO.File]::WriteAllText($backgroundParams, ($values | ConvertTo-Json -Depth 10), $utf8)

# 自定义插件不登记为上游自带文件，避免旧版 CLI 升级时将它当作已撤下效果清理。
New-Item -ItemType Directory -Path $pluginTarget -Force | Out-Null
foreach ($file in @('effect.js', 'effect.css', 'effect.json', 'README.md')) {
    Copy-Item -LiteralPath (Join-Path $pluginSource $file) -Destination (Join-Path $pluginTarget $file) -Force
}
$startupValues = @{ enabled = $true; duration = 4 }
[IO.File]::WriteAllText((Join-Path $pluginTarget 'params.json'), ($startupValues | ConvertTo-Json), $utf8)

& node $installedCli reload
if ($LASTEXITCODE -ne 0) { throw "已保存设置，但效果刷新失败。备份位于 $backup" }
Write-Output '已应用 OpenAI 启动画面和静态背景。未重启 Codex。'
