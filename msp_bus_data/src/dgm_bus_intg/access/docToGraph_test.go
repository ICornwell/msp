package access

import (
	"dgm_bus_intg/apiMessages"
	"dgm_bus_intg/jsonDoc"
	"testing"

	"gotest.tools/assert"
)

func TestUpsertViewData_AddsForwardRelationEdgeFromParentToChild(t *testing.T) {
	view := apiMessages.ViewQuery{
		RootKey: "id",
		RootElement: apiMessages.ViewElement{
			Object:       "person",
			DocPathName:  "person",
			QueryObjectId: "p",
			IsEntity:     true,
			SubElements: []apiMessages.ViewElement{
				{
					Object:             "address",
					DocPathName:        "address",
					QueryObjectId:      "a",
					RelationFromParent: "hasAddress",
					IsEntity:           false,
				},
			},
		},
	}

	currentData := jsonDoc.JsonDoc{
		"id":   "person-1",
		"name": "Alice",
	}
	newData := jsonDoc.JsonDoc{
		"id":   "person-1",
		"name": "Alice",
		"address": jsonDoc.JsonDoc{
			"__tmpId": "address-tmp-1",
			"street":  "123 Main St",
		},
	}

	diffs := jsonDoc.DiffDocs(newData, currentData, []string{})
	request := upsertViewData(view, newData, currentData, jsonDoc.JsonDoc{}, diffs, "person-1", "tx-1")

	assert.Equal(t, len(request.Add.Edges), 1)
	assert.Equal(t, request.Add.Edges[0].Label, "hasAddress")
	assert.Equal(t, request.Add.Edges[0].From, "person-1")
	assert.Equal(t, request.Add.Edges[0].To, "address-tmp-1")
}

func TestUpsertViewData_AddsBackRelationEdgeFromChildToParent(t *testing.T) {
	view := apiMessages.ViewQuery{
		RootKey: "id",
		RootElement: apiMessages.ViewElement{
			Object:       "person",
			DocPathName:  "person",
			QueryObjectId: "p",
			IsEntity:     true,
			SubElements: []apiMessages.ViewElement{
				{
					Object:           "account",
					DocPathName:      "account",
					QueryObjectId:    "a",
					RelationToParent: "belongsTo",
					IsEntity:         true,
				},
			},
		},
	}

	currentData := jsonDoc.JsonDoc{
		"id":   "person-1",
		"name": "Alice",
	}
	newData := jsonDoc.JsonDoc{
		"id":   "person-1",
		"name": "Alice",
		"account": jsonDoc.JsonDoc{
			"__tmpId":       "account-tmp-1",
			"__businessKey": "ACC-001",
			"accountNumber": "ACC-001",
		},
	}

	diffs := jsonDoc.DiffDocs(newData, currentData, []string{})
	request := upsertViewData(view, newData, currentData, jsonDoc.JsonDoc{}, diffs, "person-1", "tx-1")

	assert.Equal(t, len(request.Add.Edges), 1)
	assert.Equal(t, request.Add.Edges[0].Label, "belongsTo")
	assert.Equal(t, request.Add.Edges[0].From, "account-tmp-1")
	assert.Equal(t, request.Add.Edges[0].To, "person-1")
}

func TestUpsertViewData_AddsBothDirectionsWhenBothRelationsAreDeclared(t *testing.T) {
	view := apiMessages.ViewQuery{
		RootKey: "id",
		RootElement: apiMessages.ViewElement{
			Object:        "person",
			DocPathName:   "person",
			QueryObjectId: "p",
			IsEntity:      true,
			SubElements: []apiMessages.ViewElement{
				{
					Object:             "account",
					DocPathName:        "account",
					QueryObjectId:      "a",
					RelationFromParent: "hasAccount",
					RelationToParent:   "belongsTo",
					IsEntity:           true,
				},
			},
		},
	}

	currentData := jsonDoc.JsonDoc{
		"id":   "person-1",
		"name": "Alice",
	}
	newData := jsonDoc.JsonDoc{
		"id":   "person-1",
		"name": "Alice",
		"account": jsonDoc.JsonDoc{
			"__tmpId":       "account-tmp-1",
			"__businessKey": "ACC-001",
			"accountNumber": "ACC-001",
		},
	}

	diffs := jsonDoc.DiffDocs(newData, currentData, []string{})
	request := upsertViewData(view, newData, currentData, jsonDoc.JsonDoc{}, diffs, "person-1", "tx-1")

	assert.Equal(t, len(request.Add.Edges), 2)

	var foundForward bool
	var foundBackward bool
	for _, edge := range request.Add.Edges {
		if edge.Label == "hasAccount" && edge.From == "person-1" && edge.To == "account-tmp-1" {
			foundForward = true
		}
		if edge.Label == "belongsTo" && edge.From == "account-tmp-1" && edge.To == "person-1" {
			foundBackward = true
		}
	}

	assert.Equal(t, foundForward, true)
	assert.Equal(t, foundBackward, true)
}

func TestHandleRemoval_ValueObjectDelinksWhenDelinkOnRemovalIsTrue(t *testing.T) {
	request := &apiMessages.UpsertRequest{}
	viewElement := apiMessages.ViewElement{
		Object:             "address",
		QueryObjectId:      "a",
		RelationFromParent: "hasAddress",
		DelinkOnRemoval:    true,
	}
	vertex := jsonDoc.JsonDoc{
		"id":         "child-1",
		"__entityId": "child-e-1",
		"__metadata": jsonDoc.JsonDoc{
			"__isEntity": false,
			"__viewType": "default",
		},
	}
	parentData := jsonDoc.JsonDoc{
		"__tmpId":    "parent-tmp-1",
		"__entityId": "parent-e-1",
		"__metadata": jsonDoc.JsonDoc{
			"__viewType":   "default",
			"__originalId": "parent-orig-1",
		},
	}
	parentCurrentData := jsonDoc.JsonDoc{
		"id":         "parent-1",
		"__entityId": "parent-e-1",
	}
	rawData := jsonDoc.JsonDoc{
		"data": jsonDoc.JsonDoc{
			"edges": []interface{}{
				jsonDoc.JsonDoc{"id": "edge-1", "from": "parent-1", "to": "child-1", "__label": "hasAddress"},
			},
		},
	}

	handleRemoval(request, viewElement, "tx-1", vertex, map[string]interface{}{}, parentData, parentCurrentData, map[string]interface{}{}, rawData)

	assert.Equal(t, len(request.Update.Vertices), 1)
	assert.Equal(t, len(request.Delete.Vertices), 0)
	assert.Equal(t, len(request.Update.Vertices[0].ViewManagedEdges), 1)
	assert.Equal(t, request.Update.Vertices[0].ViewManagedEdges[0], "edge-1")
}

func TestHandleRemoval_ValueObjectSoftDeletesWhenDelinkFlagIsFalse(t *testing.T) {
	request := &apiMessages.UpsertRequest{}
	viewElement := apiMessages.ViewElement{
		Object:             "address",
		QueryObjectId:      "a",
		RelationFromParent: "hasAddress",
	}
	vertex := jsonDoc.JsonDoc{
		"id":         "child-1",
		"__entityId": "child-e-1",
		"__metadata": jsonDoc.JsonDoc{
			"__isEntity": false,
			"__viewType": "default",
		},
	}

	handleRemoval(request, viewElement, "tx-1", vertex, map[string]interface{}{"street": "A"}, jsonDoc.JsonDoc{}, jsonDoc.JsonDoc{}, map[string]interface{}{}, jsonDoc.JsonDoc{})

	assert.Equal(t, len(request.Update.Vertices), 0)
	assert.Equal(t, len(request.Delete.Vertices), 1)
	assert.Equal(t, request.Delete.Vertices[0].OriginalId, "child-1")
}

func TestHandleRemoval_EntityAlwaysDelinks(t *testing.T) {
	request := &apiMessages.UpsertRequest{}
	viewElement := apiMessages.ViewElement{
		Object:             "person",
		QueryObjectId:      "p",
		RelationFromParent: "hasPerson",
		DelinkOnRemoval:    false,
		CascadeDeletes:     false,
	}
	vertex := jsonDoc.JsonDoc{
		"id":         "child-entity-1",
		"__entityId": "child-entity-e1",
		"__metadata": jsonDoc.JsonDoc{
			"__isEntity": true,
			"__viewType": "default",
		},
	}
	parentData := jsonDoc.JsonDoc{
		"__tmpId":    "parent-tmp-1",
		"__entityId": "parent-e-1",
		"__metadata": jsonDoc.JsonDoc{
			"__viewType":   "default",
			"__originalId": "parent-orig-1",
		},
	}
	parentCurrentData := jsonDoc.JsonDoc{
		"id":         "parent-1",
		"__entityId": "parent-e-1",
	}
	rawData := jsonDoc.JsonDoc{
		"data": jsonDoc.JsonDoc{
			"edges": []interface{}{
				jsonDoc.JsonDoc{"id": "edge-entity-1", "from": "parent-1", "to": "child-entity-1", "__label": "hasPerson"},
			},
		},
	}

	handleRemoval(request, viewElement, "tx-1", vertex, map[string]interface{}{}, parentData, parentCurrentData, map[string]interface{}{}, rawData)

	assert.Equal(t, len(request.Update.Vertices), 1)
	assert.Equal(t, len(request.Delete.Vertices), 0)
	assert.Equal(t, len(request.Update.Vertices[0].ViewManagedEdges), 1)
	assert.Equal(t, request.Update.Vertices[0].ViewManagedEdges[0], "edge-entity-1")
}
