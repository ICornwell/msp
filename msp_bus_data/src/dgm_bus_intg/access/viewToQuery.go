package access

import (
	"dgm_bus_intg/apiMessages"
	"dgm_bus_intg/jsonDoc"
	"dgm_bus_intg/outbound"
	"encoding/json"
	"time"
)

func RunQuery(vq apiMessages.ViewQuery, key string, includeMetaData bool) (jsonDoc.JsonDoc, jsonDoc.JsonDoc, error) {
	// should come from config, of course
	dgq := ViewToQuery(vq, key)

	responseBody, err := outbound.OutBoundRequest("graph/query", dgq)
	if err != nil {
		return nil, nil, err
	}

	obj := map[string]interface{}{}
	err5 := json.Unmarshal(responseBody, &obj)
	if err5 != nil {
		return nil, nil, err5
	}

	doc := graphToDoc(vq, obj, key, includeMetaData)

	return doc, obj, nil
}

func ViewToQuery(vq apiMessages.ViewQuery, key string) apiMessages.DgQuery {
	dgQuery := apiMessages.DgQuery{
		Name:                 vq.Name,
		Version:              vq.Version,
		User:                 vq.User,
		QueryDate:            time.Now().UTC().String(),
		Objects:              []apiMessages.QueryObject{},
		Relations:            []apiMessages.QueryRelation{},
		View:                 vq.Name,
		ViewVersion:          vq.Version,
		RootQueryKeyProperty: "accountNumber", // should come from a metadata lookup for the rootElement type key def.
		RootQueryKeyValue:    key,
		IsLatestOnly:         true,
		UseEntityIdAsKey:     true,
		Timestamp:            time.Now().UTC().UnixMicro(),
		QueryType:            "Hierarchy",
		RootQueryKeyTypes:    "string",
	}

	if vq.User == "" {
		dgQuery.User = "system"
	}

	recurseFillQueryParts(&dgQuery, vq.RootElement, true)

	return dgQuery
}

func recurseFillQueryParts(dgq *apiMessages.DgQuery, el apiMessages.ViewElement, isRoot bool) {

	attributes := el.Attributes
	if attributes == nil {
		attributes = []string{}
	}

	dgqp :=apiMessages.QueryObject{
		Type:          el.Object, // we'll need to start reading the metadata to resolve this, when different to originalType
		OriginalType:  el.Object,
		IsQueryRoot:   isRoot,
		QueryObjectId: el.QueryObjectId,
		Attributes:    attributes,
	}
	dgq.Objects = append(dgq.Objects, dgqp)

	for _, element := range el.SubElements {
		if element.RelationFromParent != "" {
			outR := apiMessages.QueryRelation{
				Type:    element.RelationFromParent, // we'll need to start reading the metadata to resolve this, when different to originalType
				From:    el.QueryObjectId,
				To:      element.QueryObjectId,
				Reverse: false,
			}
			dgq.Relations = append(dgq.Relations, outR)
		}
		if element.RelationToParent != "" {
			inR := apiMessages.QueryRelation{
				Type:    element.RelationFromParent, // we'll need to start reading the metadata to resolve this, when different to originalType
				From:    element.QueryObjectId,
				To:      el.QueryObjectId,
				Reverse: false,
			}
			dgq.Relations = append(dgq.Relations, inR)
		}
		recurseFillQueryParts(dgq, element, false)
	}
}
