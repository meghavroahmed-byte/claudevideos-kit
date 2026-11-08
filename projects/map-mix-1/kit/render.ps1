# parallel render: .\render.ps1 [-workers 3] [-from 0] [-to <frames>] [-tag part]
param([int]$workers = 3, [int]$from = 0, [int]$to = 15257, [string]$tag = 'part')
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine')
Set-Location D:\ClaudeVideos\projects\map-mix-1\kit
$n = $to - $from; $per = [math]::Ceiling($n / $workers); $jobs = @()
for ($w = 0; $w -lt $workers; $w++) {
  $s = $from + $w * $per; $cnt = [math]::Min($per, $to - $s); if ($cnt -le 0) { continue }
  $out = "..\out\${tag}_$w.mp4"
  $jobs += Start-Process -FilePath node -ArgumentList @('run.js', 'video', 'vid.html', $out, $cnt, 30, $s) -NoNewWindow -PassThru -RedirectStandardOutput "..\out\${tag}_$w.log" -RedirectStandardError "..\out\${tag}_$w.err"
}
$jobs | Wait-Process
Get-ChildItem "..\out\${tag}_*.mp4" | % { "{0} {1:N1}MB" -f $_.Name, ($_.Length / 1MB) }
