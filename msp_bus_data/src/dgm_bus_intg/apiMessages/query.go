package apiMessages

type ViewQuery struct {
	Name        string      `json:"name"`
	Version     string      `json:"version"`
	User        string      `json:"user"`
	ConfigSet   string      `json:"configSet"`
	RootKey     string      `json:"rootKey"`
	RootElement ViewElement `json:"rootElement"`
}

type ViewElement struct {
	Object             string        `json:"object"`
	DocumentName       string        `json:"documentName,omitempty"`
	QueryObjectId      string        `json:"queryObjectId"`
	RelationFromParent string        `json:"relationFromParent"`
	RelationToParent   string        `json:"relationToParent,omitempty"`
	IsCollection       bool          `json:"isCollection"`
	IsEntity           bool          `json:"isEntity"`
	Attributes         []string      `json:"attributes"`
	SubElements        []ViewElement `json:"subElements"`
}

type UpsertQuery struct {
	View ViewQuery              `json:"view"`
	Data map[string]interface{} `json:"data"`
}
