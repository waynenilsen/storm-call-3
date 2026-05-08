#!/bin/bash
#
# find_free_port [min] [max] [max_attempts]
#
# Picks a random TCP port in [min, max] that is not currently in use on
# localhost. Retries up to max_attempts (default 50) before failing.
#
# Designed to be sourced by initialize-workspace.sh. Run directly to self-test.

set -euo pipefail

# Returns 0 if $1 is listening on localhost, 1 otherwise.
port_in_use() {
  local port="$1"
  # lsof is on both macOS and the Linux images we target; -t makes it terse,
  # -sTCP:LISTEN narrows it to actual listeners (vs. transient client sockets).
  if lsof -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

find_free_port() {
  local min="${1:-50000}"
  local max="${2:-60000}"
  local max_attempts="${3:-50}"
  local span=$((max - min + 1))
  local attempt=0
  local port

  while [ "$attempt" -lt "$max_attempts" ]; do
    port=$((min + RANDOM % span))
    if ! port_in_use "$port"; then
      echo "$port"
      return 0
    fi
    attempt=$((attempt + 1))
  done

  echo "find_free_port: failed to find a free port in [$min, $max] after $max_attempts attempts" >&2
  return 1
}

# Self-test when invoked directly (not sourced).
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  fail() { echo "FAIL: $*" >&2; exit 1; }
  pass() { echo "PASS: $*"; }

  echo "== test 1: returns a port in range =="
  p=$(find_free_port 50000 60000 50)
  [ "$p" -ge 50000 ] && [ "$p" -le 60000 ] || fail "port $p not in [50000,60000]"
  port_in_use "$p" && fail "returned port $p is reportedly in use"
  pass "got free port $p in range"

  echo "== test 2: avoids a port we are already listening on =="
  # Spin up a listener with python3 so we can pin the busy port deterministically.
  busy_port=$(find_free_port 50000 60000 50)
  python3 -c "
import socket, sys, time
s = socket.socket()
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind(('127.0.0.1', $busy_port))
s.listen(1)
sys.stdout.write('ready\n'); sys.stdout.flush()
time.sleep(5)
" >/tmp/find-free-port-listener.out 2>&1 &
  listener_pid=$!
  # Wait until the listener prints "ready".
  for _ in $(seq 1 50); do
    if grep -q ready /tmp/find-free-port-listener.out 2>/dev/null; then break; fi
    sleep 0.05
  done
  port_in_use "$busy_port" || { kill "$listener_pid" 2>/dev/null || true; fail "test setup: $busy_port should be in use"; }

  # Force the gen/check/regen loop to encounter the busy port by narrowing the
  # range to a single port for the first attempt, then widening. Easier: just
  # call find_free_port and assert it doesn't return busy_port — with span
  # 10001 the odds of equality are negligible, but we also pin via narrow range.
  got=$(find_free_port "$busy_port" "$busy_port" 5 && echo "unexpected" || echo "rejected")
  [ "$got" = "rejected" ] || fail "expected rejection when only choice is busy port"
  pass "rejected single-port range when that port is busy"

  # And in a normal range it should still find something free and not collide.
  p2=$(find_free_port 50000 60000 50)
  [ "$p2" != "$busy_port" ] || fail "got the busy port back"
  pass "skipped busy port $busy_port, returned $p2"

  kill "$listener_pid" 2>/dev/null || true
  wait "$listener_pid" 2>/dev/null || true

  echo "== test 3: max_attempts is respected =="
  # Range of one port that we know is busy → must give up after N tries.
  busy_port=$(find_free_port 50000 60000 50)
  python3 -c "
import socket, time
s = socket.socket(); s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind(('127.0.0.1', $busy_port)); s.listen(1)
time.sleep(3)
" &
  listener_pid=$!
  sleep 0.3
  if find_free_port "$busy_port" "$busy_port" 3 >/dev/null 2>&1; then
    kill "$listener_pid" 2>/dev/null || true
    fail "find_free_port should have failed but succeeded"
  fi
  pass "gave up after max_attempts on a fully busy range"
  kill "$listener_pid" 2>/dev/null || true
  wait "$listener_pid" 2>/dev/null || true

  echo "All tests passed."
fi
