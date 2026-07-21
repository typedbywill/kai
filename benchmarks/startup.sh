#!/usr/bin/env bash
# Benchmark: KAI startup time
# Target: < 300ms for service startup

set -e

BINARY="${1:-$HOME/.local/bin/kai}"

if [ ! -f "$BINARY" ]; then
  echo "Binary not found at $BINARY"
  echo "Usage: $0 [path_to_binary]"
  exit 1
fi

echo "=== KAI Startup Benchmark ==="
echo "Binary: $BINARY"
echo ""

# Kill any existing instance
pkill -x kai 2>/dev/null || true
sleep 0.5

# Measure startup time (time until IPC socket is available)
SOCKET_PATH="${XDG_RUNTIME_DIR:-/tmp}/kai_overlay.sock"
rm -f "$SOCKET_PATH"

START=$(date +%s%N)
$BINARY --foreground &
PID=$!

# Wait for socket to appear (max 5 seconds)
TIMEOUT=50
COUNT=0
while [ ! -S "$SOCKET_PATH" ] && [ $COUNT -lt $TIMEOUT ]; do
  sleep 0.1
  COUNT=$((COUNT + 1))
done

END=$(date +%s%N)
ELAPSED_MS=$(( (END - START) / 1000000 ))

# Clean up
kill $PID 2>/dev/null || true
wait $PID 2>/dev/null || true

if [ $COUNT -ge $TIMEOUT ]; then
  echo "FAIL: KAI did not start within 5 seconds"
  exit 1
fi

echo "Startup time: ${ELAPSED_MS}ms"

if [ $ELAPSED_MS -le 300 ]; then
  echo "PASS: Within 300ms target ✓"
else
  echo "FAIL: Exceeds 300ms target ✗"
  exit 1
fi
