# MSP Security Testing Issuer

`msp_security` can expose an opt-in local issuer for tests and internal development. It issues ordinary RS256 bearer JWTs, so consuming services validate them through their existing JWT middleware.

## Enable locally

Set this in the runtime environment of `msp_security`:

```text
MSP_SECURITY_TESTING_ISSUER_ENABLED=true
```

The default issuer URL is derived from the security service URL:

```text
http://localhost:4004/testing
```

Override it with `MSP_SECURITY_TESTING_ISSUER_URL` when the service is reached through another host or port.

To make platform services use this issuer for their normal service-to-service
tokens, set the same issuer URL in each service environment:

```text
MSP_Service_IdP=http://localhost:4004/testing
```

This changes the shared generic token provider's endpoint from Entra's
`/oauth2/v2.0/token` to the testing issuer's `/token`. No service test flow or
special authentication code is required. The token endpoint accepts the normal
client-credentials request shape, but does not require the supplied credentials
when this explicitly enabled testing issuer is selected.

The issuer uses the active `msp_security` signing key environment values and publishes its verification key at:

```text
http://localhost:4004/testing/.well-known/openid-configuration
http://localhost:4004/testing/jwks.json
```

## Trust it in consumers

Add the issuer URL to the consumer's trusted issuer configuration. For local development, the resulting value should include:

```text
MSP_core_issuers=http://localhost:4004/testing
MSP_aud=msp_datahub,msp_servicehub
```

Keep this issuer out of production trusted-issuer configuration unless the deployment is explicitly an internal testing environment.

## Issue a token

No client credentials are required. The caller supplies the service identity, audience, and scopes in a JSON or form-encoded request:

```http
POST /testing/token
Content-Type: application/json

{
  "subject": "msp_pamela",
  "audience": ["msp_datahub"],
  "scope": ["data.write", "pamela.assertions.write"],
  "tenantId": "test-tenant",
  "roles": ["writer"],
  "permissions": ["data.write"]
}
```

The response is a normal OAuth-style bearer response:

```json
{
  "access_token": "<jwt>",
  "token_type": "Bearer",
  "expires_in": 300,
  "scope": "data.write pamela.assertions.write"
}
```

The issuer also accepts additional claims through `claims`, except for reserved JWT claims such as `iss`, `sub`, `aud`, `iat`, and `exp`. Token lifetime is capped by `MSP_SECURITY_TESTING_MAX_TTL_SECONDS`, which defaults to 3600 seconds.

This endpoint is intentionally not a replacement for Entra ID. It is a local, explicitly enabled test issuer that produces the same signed-token shape expected by the platform's normal validation path.
