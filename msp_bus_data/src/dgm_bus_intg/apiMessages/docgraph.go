package apiMessages

import "dgm_bus_intg/jsonDoc"

type DgQuery struct {
	Name                 string      `json:"name,omitempty"`
	Version              string      `json:"version,omitempty"`
	User                 string      `json:"user"`
	QueryDate            string      `json:"queryDate,omitempty"`
	View                 string      `json:"view"`
	ViewVersion          string      `json:"viewVersion"`
	RootQueryKeyProperty string      `json:"rootQueryKeyProperty,omitempty"`
	RootQueryKeyValue    string      `json:"rootQueryKeyValue,omitempty"`
	RootQueryKeyTypes    string      `json:"rootQueryKeyTypes"`
	UseEntityIdAsKey     bool        `json:"useEntityIdAsKey,omitempty"`
	IsLatestOnly         bool        `json:"isLatestOnly,omitempty"`
	Timestamp            int64       `json:"timeStamp,omitempty"`
	QueryType            string      `json:"queryType,omitempty"`
	Objects              []QueryObject `json:"getObjects,omitempty"`
	Relations            []QueryRelation `json:"getRelations,omitempty"`
}

type QueryPart struct {
	Object   *QueryObject   `json:"object,omitempty"`
	Relation *QueryRelation `json:"relation,omitempty"`
}

type QueryObject struct {
	Type            string          `json:"type"`
	OriginalId      string          `json:"originalId"`
	OriginalType    string          `json:"originalType"`
	IsQueryRoot     bool            `json:"isQueryRoot"`
	QueryObjectId   string          `json:"queryObjectId"`
	Attributes      []string        `json:"attributes"`
	Content         jsonDoc.JsonDoc `json:"content"`
	RelationsToDrop []QueryRelation `json:"relationsToDrop"`
}

type QueryRelation struct {
	From        string `json:"from"`
	To          string `json:"to"`
	FromKeyType string `json:"fromKeyType"`
	ToKeyType   string `json:"toKeyType"`
	Type        string `json:"type"`
	Reverse     bool   `json:"reverse"`
}
