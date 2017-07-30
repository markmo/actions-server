#!/usr/bin/env bash
docker run -p 49133:8080 -e API_URL=http://aiplatform.host/actions-server/api-docs.json -d swaggerapi/swagger-ui
