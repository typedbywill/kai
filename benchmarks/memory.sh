#!/usr/bin/env bash
# Benchmark: KAI memory consumption

set -e

echo "=== KAI Memory Benchmark ==="

PID=$(pgrep -x kai 2>/dev/null | head -1)

if [ -z "$PID" ]; then
  echo "KAI is not running. Starting via systemd..."
  systemctl --user start kai.service 2>/dev/null || true
  sleep 1
  PID=$(pgrep -x kai 2>/dev/null | head -1)
fi

if [ -z "$PID" ]; then
  echo "KAI process not found."
  exit 1
fi

echo "Main KAI PID: $PID"

# Read main process RSS
if [ -f "/proc/$PID/status" ]; then
  MAIN_RSS_KB=$(grep VmRSS /proc/$PID/status | awk '{print $2}')
  MAIN_RSS_MB=$((MAIN_RSS_KB / 1024))
  echo "Backend Process RSS: ${MAIN_RSS_MB}MB (${MAIN_RSS_KB}KB)"
fi

# Total memory including WebKitGTK subprocesses
TOTAL_RSS_KB=0
for child in $(pgrep -P $PID 2>/dev/null; echo $PID); do
  if [ -f "/proc/$child/status" ]; then
    kb=$(grep VmRSS /proc/$child/status | awk '{print $2}')
    TOTAL_RSS_KB=$((TOTAL_RSS_KB + kb))
  fi
done

TOTAL_RSS_MB=$((TOTAL_RSS_KB / 1024))
echo "Total App RSS (Backend + WebKitGTK): ${TOTAL_RSS_MB}MB (${TOTAL_RSS_KB}KB)"

if [ $MAIN_RSS_MB -le 50 ]; then
  echo "PASS: Backend process within 50MB target ✓"
else
  echo "WARN: Backend process exceeds 50MB target ✗"
fi
