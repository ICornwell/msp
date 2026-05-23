package access

import (
	"dgm_bus_intg/apiMessages"
	"fmt"
)

// RunUpsertInNewTransaction provides a business-level helper for begin -> upsert -> commit.
// If upsert fails, it attempts a rollback before returning the original upsert error.
func RunUpsertInNewTransaction(
	uq apiMessages.UpsertQuery,
	key string,
	callType string,
) (apiMessages.UpsertResponse, apiMessages.TransactionResult, error) {
	beginResult, err := BeginTransaction()
	if err != nil {
		return apiMessages.UpsertResponse{}, apiMessages.TransactionResult{}, err
	}

	upsertResponse, upsertErr := RunUpsert(uq, key, callType, beginResult.TransactionId)
	if upsertErr != nil {
		_, rollbackErr := RollbackTransaction(apiMessages.TransactionCommand{
			Token: beginResult.Token,
		})
		if rollbackErr != nil {
			return upsertResponse, beginResult, fmt.Errorf("upsert failed: %w; rollback also failed: %v", upsertErr, rollbackErr)
		}
		return upsertResponse, beginResult, upsertErr
	}

	commitResult, commitErr := CommitTransaction(apiMessages.TransactionCommand{
		Token: beginResult.Token,
	})
	if commitErr != nil {
		return upsertResponse, beginResult, commitErr
	}

	return upsertResponse, commitResult, nil
}
