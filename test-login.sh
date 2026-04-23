#!/bin/bash

# Login test script
# Usage: bash test-login.sh <studentId> <password>

if [ $# -lt 2 ]; then
    echo "Usage: $0 <studentId> <password>"
    echo ""
    echo "Example: $0 24302D0075 MyPassword123!"
    exit 1
fi

STUDENT_ID="$1"
PASSWORD="$2"

echo "🔑 Testing login for student: $STUDENT_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"role\":\"student\",\"studentId\":\"$STUDENT_ID\",\"password\":\"$PASSWORD\"}" | jq . 2>/dev/null || echo "❌ Login failed"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
