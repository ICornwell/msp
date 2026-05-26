package routes

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"dgm_bus_intg/access"
	"dgm_bus_intg/apiMessages"

	"github.com/gin-gonic/gin"
)

const transactionTokenHeader = "X-Transaction-Token"

func getTransactionToken(c *gin.Context) string {
	token := strings.TrimSpace(c.GetHeader(transactionTokenHeader))
	if token != "" {
		return token
	}
	return strings.TrimSpace(c.Query("transaction_token"))
}

func renderTransactionResult(result apiMessages.TransactionResult) gin.H {
	return gin.H{
		"success":       result.Success,
		"token":         result.Token,
		"transactionId": result.TransactionId,
		"timestamp":     result.Timestamp,
		"committed":     result.Committed,
		"rolledBack":    result.RolledBack,
		"message":       result.Message,
	}
}

func addDocGraphRoutes(rg *gin.RouterGroup) {
	doc := rg.Group("/doc")

	doc.PUT("/test", func(c *gin.Context) {
		jsonData, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err.Error()))
			return
		}

		obj := map[string]interface{}{}
		err2 := json.Unmarshal(jsonData, &obj)
		if err2 != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err2.Error()))
			return
		}

		c.JSON(http.StatusOK, obj)
	})

	doc.PUT("/query/:key", func(c *gin.Context) {
		transactionToken := getTransactionToken(c)
		readUncommitted := c.DefaultQuery("read-uncommitted", "false") == "true"
		jsonData, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err.Error()))
			return
		}

		obj := apiMessages.ViewQuery{}
		err2 := json.Unmarshal(jsonData, &obj)
		if err2 != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err2.Error()))
			return
		}

		result, _, error := access.RunQuery(obj, c.Param("key"), true, transactionToken, readUncommitted)
		if error != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", error.Error()))
			return
		}

		c.JSON(http.StatusOK, result)
	})

	doc.PUT("/upsert/:key", func(c *gin.Context) {
		callType := c.DefaultQuery("type", "exec")
		transactionToken := getTransactionToken(c)
		jsonData, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err.Error()))
			return
		}

		obj := apiMessages.UpsertQuery{}
		err2 := json.Unmarshal(jsonData, &obj)
		if err2 != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err2.Error()))
			return
		}

		// we handle this be creating a transaction
		/* if callType != "preview" && transactionToken == "" {
			c.JSON(http.StatusBadRequest, "failed with error: transaction token is required")
			return
		} */

		transactionId := ""
		if transactionToken != "" {
			cmd := apiMessages.TransactionCommand{Token: transactionToken}
			resolved, resolveErr := access.ResolveTransaction(cmd)
			if resolveErr != nil {
				c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", resolveErr.Error()))
				return
			}
			transactionId = resolved.TransactionId
		}

		response, error := access.RunUpsert(obj, c.Param("key"), callType, transactionId, transactionToken)
		if error != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", error.Error()))
			return
		}

		c.JSON(http.StatusOK, response)
	})

	// Single-call business upsert route: begin -> upsert -> commit.
	// On upsert failure this path attempts rollback and returns the partial state.
	//
	// Example request:
	//   PUT /doc/upsert-transaction/{key}?type=exec
	//   body: {"view": { ... }, "data": { ... }}
	//
	// Example success response:
	//   {
	//     "upsert": {
	//       "success": true,
	//       "message": "success",
	//       "entity_ids": [ ... ]
	//     },
	//     "transaction": {
	//       "success": true,
	//       "token": "H4sI...",
	//       "transactionId": "018f...",
	//       "timestamp": 1710100200,
	//       "committed": true,
	//       "rolledBack": false
	//     }
	//   }
	//
	// Example error response:
	//   {
	//     "error": "...",
	//     "upsert": { ... },
	//     "transaction": { ... }
	//   }
	doc.PUT("/upsert-transaction/:key", func(c *gin.Context) {
		callType := c.DefaultQuery("type", "exec")
		jsonData, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err.Error()))
			return
		}

		obj := apiMessages.UpsertQuery{}
		err2 := json.Unmarshal(jsonData, &obj)
		if err2 != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err2.Error()))
			return
		}

		upsertResponse, txResult, txErr := access.RunUpsertInNewTransaction(obj, c.Param("key"), callType)
		if txErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":       txErr.Error(),
				"upsert":      upsertResponse,
				"transaction": renderTransactionResult(txResult),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"upsert":      upsertResponse,
			"transaction": renderTransactionResult(txResult),
		})
	})

	// Business transaction API examples:
	// 1) Begin
	//    POST /doc/transaction/begin
	//    body: {}
	//    response:
	//      {
	//        "success": true,
	//        "token": "H4sI...",
	//        "transactionId": "018f...",
	//        "timestamp": 1710100200,
	//        "committed": false,
	//        "rolledBack": false
	//      }
	// 2) Use the transaction in write calls
	//    PUT /doc/upsert/{key}
	//    header: X-Transaction-Token: {token}
	// 2b) Use the transaction in reads when uncommitted state is desired
	//    PUT /doc/query/{key}?read-uncommitted=true
	//    header: X-Transaction-Token: {token}
	// 3) Commit
	//    POST /doc/transaction/commit
	//    body: {"token":"H4sI..."}
	// 4) Rollback
	//    POST /doc/transaction/rollback
	//    body: {"token":"H4sI..."}

	doc.POST("/transaction/begin", func(c *gin.Context) {
		result, err := access.BeginTransaction()
		if err != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err.Error()))
			return
		}

		c.JSON(http.StatusOK, renderTransactionResult(result))
	})

	doc.POST("/transaction/commit", func(c *gin.Context) {
		cmd := apiMessages.TransactionCommand{}
		if err := c.ShouldBindJSON(&cmd); err != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err.Error()))
			return
		}
		if cmd.Token == "" {
			cmd.Token = getTransactionToken(c)
		}
		if cmd.Token == "" {
			c.JSON(http.StatusBadRequest, "failed with error: transaction token is required")
			return
		}

		result, err := access.CommitTransaction(cmd)
		if err != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err.Error()))
			return
		}

		c.JSON(http.StatusOK, renderTransactionResult(result))
	})

	doc.POST("/transaction/rollback", func(c *gin.Context) {
		cmd := apiMessages.TransactionCommand{}
		if err := c.ShouldBindJSON(&cmd); err != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err.Error()))
			return
		}
		if cmd.Token == "" {
			cmd.Token = getTransactionToken(c)
		}
		if cmd.Token == "" {
			c.JSON(http.StatusBadRequest, "failed with error: transaction token is required")
			return
		}

		result, err := access.RollbackTransaction(cmd)
		if err != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err.Error()))
			return
		}

		c.JSON(http.StatusOK, renderTransactionResult(result))
	})
}
