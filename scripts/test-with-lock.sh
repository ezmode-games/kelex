#!/bin/bash
# Test runner with file-based mutex to prevent parallel test execution
# Usage: ./scripts/test-with-lock.sh [test args...]
# Example: ./scripts/test-with-lock.sh --filter=@phantom-zone/storage

set -e

LOCK_FILE="/tmp/phantom-zone-test.lock"
LOCK_TIMEOUT=60
MAX_WAIT=1800  # 30 minutes max wait

acquire_lock() {
  local waited=0

  while [ -f "$LOCK_FILE" ]; do
    local lock_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")

    # Check if the locking process is still alive
    if [ -n "$lock_pid" ] && ! kill -0 "$lock_pid" 2>/dev/null; then
      echo "Stale lock from PID $lock_pid detected, removing..."
      rm -f "$LOCK_FILE"
      break
    fi

    if [ $waited -ge $MAX_WAIT ]; then
      echo "ERROR: Timed out waiting for test lock after ${MAX_WAIT}s"
      exit 1
    fi

    echo "Tests locked by PID $lock_pid. Waiting ${LOCK_TIMEOUT}s... (${waited}s elapsed)"
    sleep $LOCK_TIMEOUT
    waited=$((waited + LOCK_TIMEOUT))
  done

  # Create lock with our PID
  echo $$ > "$LOCK_FILE"
  echo "Acquired test lock (PID $$)"
}

release_lock() {
  if [ -f "$LOCK_FILE" ]; then
    local lock_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
    if [ "$lock_pid" = "$$" ]; then
      rm -f "$LOCK_FILE"
      echo "Released test lock (PID $$)"
    fi
  fi
}

# Release lock on exit (success or failure)
trap release_lock EXIT

# Acquire the lock
acquire_lock

# Run tests with all passed arguments
echo "Running: pnpm test $@"
pnpm test "$@"
