#!/bin/bash
URL="https://hunkibae-dotcom.github.io/dashbord-1/%EC%88%98%EC%B6%9C%EA%B2%80%EC%82%AC%EB%A6%AC%EC%8A%A4%ED%8A%B8_%EB%8C%80%EC%8B%9C%EB%B3%B4%EB%93%9C.html"
for i in $(seq 1 30); do
  LEN=$(curl -s "$URL" | wc -c)
  LOCAL_LEN=$(wc -c < "수출검사리스트_대시보드.html")
  if [ "$LEN" = "$LOCAL_LEN" ]; then
    echo "DEPLOY MATCHED after ${i} tries (len=$LEN)"
    break
  fi
  sleep 3
done
curl -s -X PUT "http://localhost:9222/json/new?${URL}" > /tmp/newtab.json
cat /tmp/newtab.json
