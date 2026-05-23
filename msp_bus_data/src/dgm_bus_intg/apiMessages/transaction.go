package apiMessages

type TransactionCommand struct {
	Token         string `json:"token,omitempty"`
	TransactionId string `json:"transactionId"`
	Timestamp     int64  `json:"timestamp,omitempty"`
}

type TransactionResult struct {
	Success       bool   `json:"success"`
	Token         string `json:"token,omitempty"`
	TransactionId string `json:"transactionId"`
	Timestamp     int64  `json:"timestamp"`
	Committed     bool   `json:"committed"`
	RolledBack    bool   `json:"rolledBack"`
	Message       string `json:"message,omitempty"`
}

type RepoTransactionResponse struct {
	Success       bool   `json:"success"`
	TransactionId string `json:"transaction_id"`
	Timestamp     string `json:"timestamp"`
	IsCommitted   bool   `json:"is_committed"`
	IsRolledBack  bool   `json:"is_rolled_back"`
	Message       string `json:"message,omitempty"`
}
