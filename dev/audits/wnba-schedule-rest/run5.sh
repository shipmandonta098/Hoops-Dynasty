#!/bin/bash
# run5.sh <repo> <out.jsonl>: 5 seeds x (2024 12/40, 2025 13/44)
out=$2; : > $out
for y in "2024 12" "2025 13"; do set -- $y; for sd in 11 12 13 14 15; do timeout 600 node -r /home/user/tmpcheck/strip-v.cjs measure.cjs $REPO $1 $2 $sd 2>/dev/null | tail -1 >> $out; done; done
