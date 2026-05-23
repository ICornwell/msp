package utils

import (
	"bytes"
	"compress/gzip"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"dgm_bus_intg/config"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"time"
)

type TransactionTokenPayload struct {
	Version       int    `json:"v"`
	TransactionId string `json:"tid"`
	Timestamp     int64  `json:"ts"`
	IssuedAt      int64  `json:"iat"`
	ExpiresAt     int64  `json:"exp"`
}

func NewTransactionToken(transactionId string, timestamp int64) (string, error) {
	now := time.Now().UTC().Unix()
	payload := TransactionTokenPayload{
		Version:       1,
		TransactionId: transactionId,
		Timestamp:     timestamp,
		IssuedAt:      now,
		ExpiresAt:     now + config.GetTransactionTokenTTLSeconds(),
	}

	plain, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	compressed, err := gzipBytes(plain)
	if err != nil {
		return "", err
	}

	signature := signTransactionToken(compressed)
	encodedPayload := base64.RawURLEncoding.EncodeToString(compressed)
	encodedSignature := base64.RawURLEncoding.EncodeToString(signature)

	return encodedPayload + "." + encodedSignature, nil
}

func ParseTransactionToken(token string) (TransactionTokenPayload, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return TransactionTokenPayload{}, fmt.Errorf("invalid transaction token format")
	}

	compressed, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return TransactionTokenPayload{}, fmt.Errorf("invalid transaction token payload")
	}

	providedSignature, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return TransactionTokenPayload{}, fmt.Errorf("invalid transaction token signature")
	}

	expectedSignature := signTransactionToken(compressed)
	if subtle.ConstantTimeCompare(providedSignature, expectedSignature) != 1 {
		return TransactionTokenPayload{}, fmt.Errorf("transaction token signature mismatch")
	}

	plain, err := gunzipBytes(compressed)
	if err != nil {
		return TransactionTokenPayload{}, fmt.Errorf("invalid compressed transaction token payload")
	}

	payload := TransactionTokenPayload{}
	if err := json.Unmarshal(plain, &payload); err != nil {
		return TransactionTokenPayload{}, fmt.Errorf("invalid transaction token payload JSON")
	}

	now := time.Now().UTC().Unix()
	if payload.ExpiresAt < now {
		return TransactionTokenPayload{}, fmt.Errorf("transaction token expired")
	}

	if payload.TransactionId == "" || payload.Timestamp == 0 {
		return TransactionTokenPayload{}, fmt.Errorf("transaction token missing required claims")
	}

	return payload, nil
}

func signTransactionToken(data []byte) []byte {
	h := hmac.New(sha256.New, []byte(config.GetTransactionTokenSecret()))
	h.Write(data)
	return h.Sum(nil)
}

func gzipBytes(input []byte) ([]byte, error) {
	var buf bytes.Buffer
	gz := gzip.NewWriter(&buf)
	if _, err := gz.Write(input); err != nil {
		return nil, err
	}
	if err := gz.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func gunzipBytes(input []byte) ([]byte, error) {
	r, err := gzip.NewReader(bytes.NewReader(input))
	if err != nil {
		return nil, err
	}
	defer r.Close()
	return io.ReadAll(r)
}
