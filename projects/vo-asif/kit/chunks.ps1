$p = "D:\ClaudeVideos\projects\short-1899"
$a = "$p\temp\a16.wav"
$dur = 145.96
$log = ffmpeg -hide_banner -i $a -af "silencedetect=n=-34dB:d=0.22" -f null - 2>&1 | Out-String
$st = [regex]::Matches($log, 'silence_start: ([\d\.]+)') | % { [double]$_.Groups[1].Value }
$en = [regex]::Matches($log, 'silence_end: ([\d\.]+)') | % { [double]$_.Groups[1].Value }
# speech segments = gaps between silences
$segs = @(); $prev = 0.0
for ($i = 0; $i -lt $st.Count; $i++) {
  if ($st[$i] - $prev -gt 0.15) { $segs += ,@($prev, $st[$i]) }
  if ($i -lt $en.Count) { $prev = $en[$i] } else { $prev = $dur }
}
if ($dur - $prev -gt 0.15) { $segs += ,@($prev, $dur) }
New-Item -ItemType Directory -Force "$p\temp\ch" | Out-Null
Get-ChildItem "$p\temp\ch" -File | Remove-Item -Force
$rows = @(); $k = 0
foreach ($s in $segs) {
  $s0 = [math]::Max([double]0, [double]$s[0] - 0.08); $s1 = [math]::Min([double]$dur, [double]$s[1] + 0.08)
  $n = "{0:D3}" -f $k
  ffmpeg -v error -y -ss $s0 -to $s1 -i $a -c pcm_s16le "$p\temp\ch\$n.wav"
  $rows += "$n,$([math]::Round($s0,3)),$([math]::Round($s1,3))"; $k++
}
$rows | Out-File -Encoding ascii "$p\temp\ch\segs.csv"
"segments: $k"

