package config

import (
	"os"
	"strconv"
)

func GetRepoUrl() string {
	return "http://localhost:5100/api/"
}

func GetTransactionTokenSecret() string {
	secret := os.Getenv("DGM_TRANSACTION_TOKEN_SECRET")
	if secret == "" {
		return "dev-only-unsafe-default-change-me"
	}
	return secret
}

func GetTransactionTokenTTLSeconds() int64 {
	ttl := os.Getenv("DGM_TRANSACTION_TOKEN_TTL_SECONDS")
	if ttl == "" {
		return 3600
	}

	parsed, err := strconv.ParseInt(ttl, 10, 64)
	if err != nil || parsed <= 0 {
		return 3600
	}

	return parsed
}
