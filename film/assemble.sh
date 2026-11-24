#!/usr/bin/env bash
# hook + acts -> out/v6/EditEasy-film-720p.mp4 with the Fish Audio voice, music ducked under it, -14 LUFS.
set -euo pipefail
cd "$(dirname "$0")/../out"
SEG=v5/seg VO=v6/vo MUSIC=${MUSIC:-music/Voltaic.mp3}
ACTS=(a_attention b_noeditor c_morph d_anyai h_arch e_inside f_explode g_close)
# hook: 1080p30 -> 720p24, keep its own audio
ffmpeg -y -loglevel error -i hook.mov -vf "scale=1280:720:flags=lanczos,fps=24" -c:v libx264 -crf 18 -pix_fmt yuv420p -an $SEG/hook.mp4
ffmpeg -y -loglevel error -i hook.mov -vn -ac 2 -ar 48000 $SEG/hook.wav
: > $SEG/list.txt; echo "file 'hook.mp4'" >> $SEG/list.txt
for a in "${ACTS[@]}"; do echo "file '$a.mp4'" >> $SEG/list.txt; done
ffmpeg -y -loglevel error -f concat -safe 0 -i $SEG/list.txt -c copy $SEG/picture.mp4
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $SEG/picture.mp4)
# absolute start (s) of each act: hook 11.9, then the act durations
declare -A D=([a_attention]=28.2 [b_noeditor]=22.0 [c_morph]=22.9 [d_anyai]=19.8 [h_arch]=25.2 [e_inside]=21.4 [f_explode]=17.7 [g_close]=24.6)
declare -A S; S[hook]=0; s=11.9; for a in "${ACTS[@]}"; do S[$a]=$s; s=$(echo "$s + ${D[$a]}" | bc); done
# voice line -> (act, offset inside the act)
VOS=("hook_vo hook 0" "a_attention a_attention 0.2" "b_noeditor b_noeditor 0.2" "c_morph c_morph 0.2" "d_anyai d_anyai 0.2" "h_arch h_arch 0.2" "e_inside e_inside 0.2" "f_explode f_explode 0.2" "g_close g_close 0.2")
IN="-i $SEG/hook.wav -i $MUSIC"; F=""; MIX=""; i=2
for v in "${VOS[@]}"; do set -- $v; ms=$(echo "(${S[$2]} + $3) * 1000 / 1" | bc); IN="$IN -i $VO/$1.wav"
  F="$F[$i:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${ms}|${ms}[v$i];"; MIX="$MIX[v$i]"; i=$((i+1)); done
N=$((i-2))
ffmpeg -y -loglevel error $IN -filter_complex "\
$F${MIX}amix=inputs=$N:normalize=0,volume=1.6,apad=whole_dur=$DUR,asplit=2[voice][key];\
[1:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:$DUR,adelay=11900|11900,afade=t=in:st=11.9:d=1.2,afade=t=out:st=$(echo "$DUR - 3" | bc):d=3,volume=0.55[mus];\
[mus][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[duck];\
[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.55[hk];\
[hk][duck][voice]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]" -map "[a]" -t $DUR -c:a pcm_s16le $SEG/audio.wav
ffmpeg -y -loglevel error -i $SEG/picture.mp4 -i $SEG/audio.wav -c:v copy -c:a aac -b:a 192k -shortest v6/EditEasy-film-720p.mp4
echo "done v6/EditEasy-film-720p.mp4 $(ffprobe -v error -show_entries format=duration -of csv=p=0 v6/EditEasy-film-720p.mp4) s"
