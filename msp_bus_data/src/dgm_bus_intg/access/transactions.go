package access

import (
	"dgm_bus_intg/apiMessages"
	"dgm_bus_intg/outbound"
	"dgm_bus_intg/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
)

func BeginTransaction() (apiMessages.TransactionResult, error) {
	transactionId := utils.GenerateId()
	timestamp := time.Now().UTC().Unix()
	result, err := requestTransactionRepo(http.MethodGet, transactionId, timestamp)
	if err != nil {
		return apiMessages.TransactionResult{}, err
	}

	token, err := utils.NewTransactionToken(result.TransactionId, result.Timestamp)
	if err != nil {
		return apiMessages.TransactionResult{}, err
	}
	result.Token = token
	return result, nil
}

func ResolveTransaction(cmd apiMessages.TransactionCommand) (apiMessages.TransactionResult, error) {
	payload, err := utils.ParseTransactionToken(cmd.Token)
	if err != nil {
		return apiMessages.TransactionResult{}, err
	}

	return apiMessages.TransactionResult{
		Success:       true,
		Token:         cmd.Token,
		TransactionId: payload.TransactionId,
		Timestamp:     payload.Timestamp,
	}, nil
}

func CommitTransaction(cmd apiMessages.TransactionCommand) (apiMessages.TransactionResult, error) {
	resolved, err := ResolveTransaction(cmd)
	if err != nil {
		return apiMessages.TransactionResult{}, err
	}

	result, err := requestTransactionRepo(http.MethodPost, resolved.TransactionId, resolved.Timestamp)
	if err != nil {
		return apiMessages.TransactionResult{}, err
	}
	result.Token = cmd.Token
	return result, nil
}

func RollbackTransaction(cmd apiMessages.TransactionCommand) (apiMessages.TransactionResult, error) {
	resolved, err := ResolveTransaction(cmd)
	if err != nil {
		return apiMessages.TransactionResult{}, err
	}

	result, err := requestTransactionRepo(http.MethodDelete, resolved.TransactionId, resolved.Timestamp)
	if err != nil {
		return apiMessages.TransactionResult{}, err
	}
	result.Token = cmd.Token
	return result, nil
}

func requestTransactionRepo(method string, transactionId string, timestamp int64) (apiMessages.TransactionResult, error) {
	responseBody, err := outbound.OutBoundRequestWithOptions(
		method,
		outbound.OutBoundRequestType_Transaction,
		nil,
		map[string]string{
			"transaction_id": transactionId,
			"timestamp":      strconv.FormatInt(timestamp, 10),
		},
	)
	if err != nil {
		return apiMessages.TransactionResult{}, err
	}

	repoResp := apiMessages.RepoTransactionResponse{}
	if err := json.Unmarshal(responseBody, &repoResp); err != nil {
		return apiMessages.TransactionResult{}, err
	}

	repoTs, _ := strconv.ParseInt(repoResp.Timestamp, 10, 64)
	if repoTs == 0 {
		repoTs = timestamp
	}

	if repoResp.TransactionId == "" {
		return apiMessages.TransactionResult{}, fmt.Errorf("transaction repo response missing transaction id")
	}

	return apiMessages.TransactionResult{
		Success:       repoResp.Success,
		TransactionId: repoResp.TransactionId,
		Timestamp:     repoTs,
		Committed:     repoResp.IsCommitted,
		RolledBack:    repoResp.IsRolledBack,
		Message:       repoResp.Message,
	}, nil
}
