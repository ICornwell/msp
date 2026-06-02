# Proxy Execution Envelope (Draft v0.1)

## Goal

Define a provider-agnostic request/response contract for secure proxy execution, where:

- callers describe one or more HTTP-like steps
- credentials are never provided directly by callers
- step outputs can feed later step inputs
- intermediate/final outputs are retained for debugging/audit with mandatory token redaction

This contract is intentionally generic so one engine can run AWS, Azure, GCP, GitHub, Stripe, and internal service flows.

## Scope boundary

- msp_security core is HTTP-only and SDK-neutral.
- Provider-specific SDK calls belong in approved secure_sdk_<provider> modules.
- msp_security can vend short-lived tokens/credentials (or opaque capability handles) to those approved modules, subject to policy.

## Core principles

1. Credentials are referenced, never inlined.
2. All external calls run under policy checks before execution.
3. Step chaining uses deterministic references to prior outputs.
4. Redaction applies to intermediate and final outputs before they leave msp_security.
5. Audit records keep sanitized request/response metadata and policy decisions.

## Request envelope

```json
{
  "version": "1.0",
  "requestId": "req-123",
  "tenantId": "tenant-a",
  "context": {
    "workItemId": "work-setup-aws-001",
    "reason": "Validate and register EKS inventory access"
  },
  "execution": {
    "continueOnError": false,
    "timeoutMs": 30000,
    "maxConcurrency": 1
  },
  "steps": [
    {
      "id": "oauth-token",
      "provider": "aws",
      "operation": "token:exchange",
      "request": {
        "method": "POST",
        "url": "https://idp.example.com/oauth2/token",
        "headers": {
          "content-type": "application/x-www-form-urlencoded",
          "authorization": "Bearer ${context.bootstrapToken}"
        },
        "body": {
          "grant_type": "client_credentials",
          "scope": "eks.read"
        }
      },
      "credentialBinding": {
        "credentialRef": "env://MSP_SECURITY_BOOTSTRAP_TOKEN",
        "injections": [
          {
            "targetPath": "request.headers.authorization",
            "mode": "bearerToken"
          }
        ]
      },
      "capture": {
        "includeRequest": false,
        "includeResponseHeaders": true,
        "includeResponseBody": true
      }
    },
    {
      "id": "list-eks",
      "provider": "aws",
      "operation": "aws:list-eks-http",
      "request": {
        "method": "GET",
        "url": "https://eks.eu-west-2.amazonaws.com/clusters",
        "headers": {
          "authorization": "Bearer ${steps.oauth-token.response.body.access_token}"
        },
        "query": {
          "maxResults": "100"
        }
      },
      "capture": {
        "includeRequest": true,
        "includeResponseHeaders": true,
        "includeResponseBody": true
      }
    }
  ],
  "redaction": {
    "mask": "***",
    "sensitiveKeyPatterns": [
      "authorization",
      "token",
      "secret",
      "apikey",
      "password",
      "set-cookie"
    ],
    "sensitivePaths": [
      "steps.*.response.body.credentials.accessKeyId",
      "steps.*.response.body.credentials.secretAccessKey",
      "steps.*.response.body.credentials.sessionToken"
    ]
  }
}
```

## Response envelope

```json
{
  "version": "1.0",
  "requestId": "req-123",
  "success": true,
  "finalStepId": "list-eks",
  "timing": {
    "startedAt": 1717286400000,
    "endedAt": 1717286401012,
    "durationMs": 1012
  },
  "steps": [
    {
      "id": "assume-role",
      "success": true,
      "status": 200,
      "response": {
        "headers": {
          "content-type": "application/xml"
        },
        "body": {
          "credentials": {
            "accessKeyId": "***",
            "secretAccessKey": "***",
            "sessionToken": "***"
          }
        }
      },
      "redactionsApplied": [
        "response.body.credentials.accessKeyId",
        "response.body.credentials.secretAccessKey",
        "response.body.credentials.sessionToken"
      ]
    },
    {
      "id": "list-eks",
      "success": true,
      "status": 200,
      "response": {
        "headers": {
          "x-amzn-requestid": "abc-123"
        },
        "body": {
          "clusters": ["dev-a", "prod-b"]
        }
      },
      "redactionsApplied": []
    }
  ],
  "output": {
    "provider": "aws",
    "operation": "eks:ListClusters",
    "data": {
      "clusters": ["dev-a", "prod-b"]
    }
  },
  "errors": []
}
```

## Placeholder and step-reference syntax

Use this format in any string field:

- `${steps.<stepId>.response.body.<path>}`
- `${steps.<stepId>.response.headers.<headerName>}`
- `${context.<key>}`

If a placeholder cannot be resolved:

- fail the step with `UNRESOLVED_REFERENCE`
- include the unresolved expression in step error details

## Credential binding modes

`credentialBinding.injections[].mode`:

- `bearerToken`: inject resolved token into target path
- `header`: inject opaque secret into a header path
- `bodyField`: inject opaque secret into a body field

Recommendation: keep msp_security core HTTP-only. If SDK signing is needed, use an approved secure_sdk module and issue short-lived credentials/tokens from msp_security.

## Sanitization and cleansing rules

Mandatory before returning response outside msp_security:

1. redact by known key pattern match (case-insensitive)
2. redact by configured explicit paths
3. strip binary payloads larger than policy threshold
4. optionally hash selected identifiers for correlation without disclosure

Store both:

- sanitized response for normal consumers
- encrypted full trace only for security/audit operators (optional policy)

## Error model

Step error format:

```json
{
  "code": "UPSTREAM_HTTP_ERROR",
  "message": "Request failed with status 403",
  "stepId": "list-eks",
  "retryable": false,
  "details": {
    "status": 403,
    "provider": "aws"
  }
}
```

Suggested error codes:

- `POLICY_DENIED`
- `UNKNOWN_PROVIDER`
- `UNSUPPORTED_OPERATION`
- `CREDENTIAL_NOT_FOUND`
- `UNRESOLVED_REFERENCE`
- `UPSTREAM_HTTP_ERROR`
- `STEP_TIMEOUT`
- `REDACTION_FAILURE`

## Coverage across providers

This envelope supports common provider patterns:

- authentication handshake steps
- token exchange
- list/get/create/update/delete
- submit job + poll status
- pagination loops (future extension)

Provider-specific logic should live in adapters, not in the envelope.

## First implementation slice

1. Implement parser/validator for envelope schema.
2. Implement step runner with reference resolution.
3. Implement generic credential binding (`bearerToken`/`header`/`bodyField`) with policy checks.
4. Implement sanitization pass on every step result and final output.
5. Add execution audit record keyed by `requestId`.
