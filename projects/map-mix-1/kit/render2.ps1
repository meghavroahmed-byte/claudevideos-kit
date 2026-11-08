# render explicit frame ranges in parallel: each item "tag:from:to"
param([string[]]$jobs)
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine')
Set-Location D:\ClaudeVideos\projects\map-mix-1\kit
$ps = foreach ($j in $jobs) { $tag, $a, $b = $j.Split(':'); Start-Process -FilePath node -ArgumentList @('run.js', 'video', 'vid.html', "..\out\$tag.mp4", ([int]$b - [int]$a), 30, $a) -NoNewWindow -PassThru -RedirectStandardOutput "..\out\$tag.log" -RedirectStandardError "..\out\$tag.err" }
$ps | Wait-Process
foreach ($j in $jobs) { $tag = $j.Split(':')[0]; $f = "..\out\$tag.mp4"; if (Test-Path $f) { "{0} {1:N1}MB" -f $tag, ((Get-Item $f).Length / 1MB) } else { "$tag MISSING" } }
