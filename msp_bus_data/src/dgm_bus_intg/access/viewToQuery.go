package access

import (
	"dgm_bus_intg/apiMessages"
	"dgm_bus_intg/jsonDoc"
	"dgm_bus_intg/outbound"
	"dgm_bus_intg/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

func RunQuery(vq apiMessages.ViewQuery, key string, includeMetaData bool, transactionToken string, readUncommitted bool) (jsonDoc.JsonDoc, jsonDoc.JsonDoc, error) {
	// should come from config, of course
	dgq := ViewToQuery(vq, key)
	queryParams := map[string]string{}

	if transactionToken != "" {
		payload, err := utils.ParseTransactionToken(transactionToken)
		if err != nil {
			return nil, nil, err
		}
		dgq.Timestamp = payload.Timestamp
		if readUncommitted {
			queryParams["read-uncommitted"] = "true"
		}
	}

	responseBody, err := outbound.OutBoundRequestWithOptions(http.MethodPut, outbound.OutBoundRequestType_Query, dgq, queryParams)
	if err != nil {
		return nil, nil, err
	}
	trimmedResponse := strings.TrimSpace(string(responseBody))
	if trimmedResponse == "" {
		return nil, nil, fmt.Errorf("repository query returned an empty response for view %q root %q", vq.Name, key)
	}

	obj := map[string]interface{}{}
	err5 := json.Unmarshal([]byte(trimmedResponse), &obj)
	if err5 != nil {
		preview := trimmedResponse
		if len(preview) > 500 {
			preview = preview[:500]
		}
		return nil, nil, fmt.Errorf("repository query returned invalid JSON for view %q root %q: %w; body=%q", vq.Name, key, err5, preview)
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
		RootQueryKeyProperty: vq.RootKey,
		RootQueryKeyValue:    key,
		IsLatestOnly:         true,
		UseEntityIdAsKey:     vq.RootKey == "__entityId",
		Timestamp:            vq.Timestamp,
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

	dgqp := apiMessages.QueryObject{
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
				Type:    element.RelationToParent, // we'll need to start reading the metadata to resolve this, when different to originalType
				From:    element.QueryObjectId,
				To:      el.QueryObjectId,
				Reverse: true,
			}
			dgq.Relations = append(dgq.Relations, inR)
		}
		recurseFillQueryParts(dgq, element, false)
	}
}
