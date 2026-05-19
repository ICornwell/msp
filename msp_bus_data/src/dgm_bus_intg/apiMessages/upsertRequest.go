package apiMessages

import "dgm_bus_intg/jsonDoc"

type UpsertRequest struct {
	Add    VerticesAndEdges `json:"add"`
	Update VerticesAndEdges `json:"update"`
	Delete VerticesAndEdges `json:"delete"`
}

type KeyIdPair struct {
	Key string `json:"key"`
	Id  string `json:"id"`
}

type GraphUpdateResponse struct {
	IsSuccess bool        `json:"success"`
	Message   string      `json:"message"`
	EntityIds []KeyIdPair `json:"entity_ids,omitempty"`
}

type UpsertResponse struct {
	IsSuccess bool          `json:"success"`
	Message   string        `json:"message"`
	EntityIds []KeyIdPair   `json:"entity_ids,omitempty"`
	Request   UpsertRequest `json:"request,omitempty"`
}

type VertexOrEdge struct {
	Object   *Vertex `json:"object,omitempty"`
	Relation *Edge   `json:"relation,omitempty"`
}

type VerticesAndEdges struct {
	Vertices []*Vertex `json:"vertices,omitempty"`
	Edges    []*Edge   `json:"edges,omitempty"`
}

type Vertex struct {
	Id               string          `json:"id"`
	TmpId            string          `json:"__tmpId"`
	OriginalId       string          `json:"__originalId"`
	PreviousId       string          `json:"__previousId"`
	QueryObjectId    string          `json:"__queryObjectId"`
	EntityId         string          `json:"__entityId"`
	TransactionId    string          `json:"__transactionId"`
	Label            string          `json:"__label"`
	IsEntity         bool            `json:"__isEntity"`
	ViewType         string          `json:"__viewType"`
	TimeStamp        int64           `json:"__timeStamp"`
	Content          jsonDoc.JsonDoc `json:"content"`
	BusinessKey      string          `json:"__businessKey"`
	AlternateKey     string          `json:"__alternateKey"`
	ViewManagedEdges []string        `json:"__viewManagedEdges"`
}

type Edge struct {
	Id            string          `json:"id"`
	EntityId      string          `json:"__entityId"`
	TransactionId string          `json:"__transactionId"`
	Label         string          `json:"__label"`
	ViewType      string          `json:"__viewType"`
	TimeStamp     int64           `json:"__timeStamp"`
	From          string          `json:"from"`
	To            string          `json:"to"`
	FromEntityId  string          `json:"from_entityId"`
	ToEntityId    string          `json:"to_entityId"`
	Content       jsonDoc.JsonDoc `json:"content"`
}
