package access

import (
	"dgm_bus_intg/apiMessages"
	"dgm_bus_intg/jsonDoc"
	"reflect"
	"testing"

	"gotest.tools/assert"
)

func TestUpsertViewData_AddsForwardRelationEdgeFromParentToChild(t *testing.T) {
	view := apiMessages.ViewQuery{
		RootKey: "id",
		RootElement: apiMessages.ViewElement{
			Object:        "person",
			DocPathName:   "person",
			QueryObjectId: "p",
			IsEntity:      true,
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
			Object:        "person",
			DocPathName:   "person",
			QueryObjectId: "p",
			IsEntity:      true,
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

func TestDeduplicateNewVertices_ReusesBusinessKeyAndRewritesEdges(t *testing.T) {
	request := &apiMessages.UpsertRequest{
		Add: apiMessages.VerticesAndEdges{
			Vertices: []*apiMessages.Vertex{
				{TmpId: "artefact-1", Label: "pamelaArtefact", BusinessKey: "shared"},
				{TmpId: "artefact-2", Label: "pamelaArtefact", BusinessKey: "shared"},
				{TmpId: "other-1", Label: "pamelaArtefact", BusinessKey: "other"},
			},
			Edges: []*apiMessages.Edge{
				{From: "artefact-2", To: "other-1"},
				{From: "other-1", To: "artefact-2"},
			},
		},
	}

	deduplicateNewVertices(request)

	assert.Equal(t, len(request.Add.Vertices), 2)
	assert.Equal(t, request.Add.Vertices[0].TmpId, "artefact-1")
	assert.Equal(t, request.Add.Edges[0].From, "artefact-1")
	assert.Equal(t, request.Add.Edges[0].To, "other-1")
	assert.Equal(t, request.Add.Edges[1].From, "other-1")
	assert.Equal(t, request.Add.Edges[1].To, "artefact-1")
}

func TestDeduplicateNewVertices_DoesNotMergeDifferentLabelsOrEmptyKeys(t *testing.T) {
	request := &apiMessages.UpsertRequest{
		Add: apiMessages.VerticesAndEdges{
			Vertices: []*apiMessages.Vertex{
				{TmpId: "artefact-1", Label: "pamelaArtefact", BusinessKey: "shared"},
				{TmpId: "assertion-1", Label: "pamelaAssertion", BusinessKey: "shared"},
				{TmpId: "empty-1", Label: "pamelaArtefact"},
				{TmpId: "empty-2", Label: "pamelaArtefact"},
			},
		},
	}

	deduplicateNewVertices(request)

	assert.Equal(t, len(request.Add.Vertices), 4)
}

func TestUpsertViewData_RepeatedFullObjectsRemainSupported(t *testing.T) {
	view := apiMessages.ViewQuery{
		RootKey: "id",
		RootElement: apiMessages.ViewElement{
			Object:        "root",
			DocPathName:   "root",
			QueryObjectId: "root",
			IsEntity:      true,
			SubElements: []apiMessages.ViewElement{{
				Object:             "child",
				DocPathName:        "children",
				QueryObjectId:      "child",
				RelationFromParent: "contains",
				IsEntity:           true,
				IsCollection:       true,
			}},
		},
	}
	data := jsonDoc.JsonDoc{
		"id": "root-1",
		"children": []interface{}{
			jsonDoc.JsonDoc{"__tmpId": "child-tmp-1", "__businessKey": "child-1", "name": "Child"},
			jsonDoc.JsonDoc{"__tmpId": "child-tmp-2", "__businessKey": "child-1", "name": "Child"},
		},
	}

	currentData := jsonDoc.JsonDoc{"id": "root-1", "children": []interface{}{}}
	diffs := jsonDoc.DiffDocs(data, currentData, []string{})
	request := upsertViewData(view, data, currentData, jsonDoc.JsonDoc{}, diffs, "root-1", "tx-1")

	assert.Equal(t, len(request.Add.Vertices), 1)
	assert.Equal(t, len(request.Add.Edges), 2)
}

func TestUpsertViewData_ISRReferenceCreatesAnAdditionalEdge(t *testing.T) {
	view := apiMessages.ViewQuery{
		RootKey: "id",
		RootElement: apiMessages.ViewElement{
			Object:        "root",
			DocPathName:   "root",
			QueryObjectId: "root",
			IsEntity:      true,
			SubElements: []apiMessages.ViewElement{{
				Object:             "child",
				DocPathName:        "children",
				QueryObjectId:      "child",
				RelationFromParent: "contains",
				IsEntity:           true,
				IsCollection:       true,
			}},
		},
	}
	data := jsonDoc.JsonDoc{
		"id": "root-1",
		"children": []interface{}{
			jsonDoc.JsonDoc{"__tmpId": "child-1", "__businessKey": "child-1", "name": "Child"},
			jsonDoc.JsonDoc{"__mspReference": jsonDoc.JsonDoc{
				"object": "child",
				"tmpId":  "child-1",
			}},
		},
	}

	diffs := jsonDoc.DiffDocs(data, jsonDoc.JsonDoc{}, []string{})
	request := upsertViewData(view, data, jsonDoc.JsonDoc{}, jsonDoc.JsonDoc{}, diffs, "root-1", "tx-1")

	assert.Equal(t, len(request.Add.Vertices), 1)
	assert.Equal(t, len(request.Add.Edges), 2)
}

func TestUpsertViewData_ISRReferenceToExistingEntityCreatesAnEdge(t *testing.T) {
	view := apiMessages.ViewQuery{
		RootKey: "id",
		RootElement: apiMessages.ViewElement{
			Object:        "root",
			DocPathName:   "root",
			QueryObjectId: "root",
			IsEntity:      true,
			SubElements: []apiMessages.ViewElement{{
				Object:             "child",
				DocPathName:        "children",
				QueryObjectId:      "child",
				RelationFromParent: "contains",
				IsEntity:           true,
				IsCollection:       true,
			}},
		},
	}
	data := jsonDoc.JsonDoc{
		"id": "root-1",
		"children": []interface{}{
			jsonDoc.JsonDoc{"__mspReference": jsonDoc.JsonDoc{
				"object":   "child",
				"entityId": "child-entity-1",
			}},
		},
	}

	diffs := jsonDoc.DiffDocs(data, jsonDoc.JsonDoc{}, []string{})
	request := upsertViewData(view, data, jsonDoc.JsonDoc{}, jsonDoc.JsonDoc{}, diffs, "root-1", "tx-1")

	assert.Equal(t, len(request.Add.Vertices), 0)
	assert.Equal(t, len(request.Add.Edges), 1)
	assert.Equal(t, request.Add.Edges[0].To, "child-entity-1")
}

func TestUpsertViewData_ISRRemoval_EntityKeepsEntityAndManagesEdge(t *testing.T) {
	view := isrRemovalTestView(true, false)
	currentData := jsonDoc.JsonDoc{
		"id": "root-1",
		"children": []interface{}{jsonDoc.JsonDoc{
			"id": "child-1", "__entityId": "child-entity-1",
			"__metadata": jsonDoc.JsonDoc{"__isEntity": true, "__label": "child"},
		}},
	}
	newData := jsonDoc.JsonDoc{"id": "root-1", "children": []interface{}{}}
	rawData := removalRawData("root-1", "child-1", "edge-entity-1")
	diffs := jsonDoc.DiffDocs(newData, currentData, []string{})
	request := upsertViewData(view, newData, currentData, rawData, diffs, "root-1", "tx-1")

	assert.Equal(t, len(request.Update.Vertices), 1)
	assert.Assert(t, reflect.DeepEqual(request.Update.Vertices[0].ViewManagedEdges, []string{"edge-entity-1"}))
	assert.Equal(t, len(request.Delete.Vertices), 0)
}

func TestUpsertViewData_ISRRemoval_ValueObjectSoftDeletesByDefault(t *testing.T) {
	view := isrRemovalTestView(false, false)
	currentData := jsonDoc.JsonDoc{
		"id": "root-1",
		"children": []interface{}{jsonDoc.JsonDoc{
			"id": "value-1", "__entityId": "root-entity-1",
			"__metadata": jsonDoc.JsonDoc{"__isEntity": false, "__label": "child"},
		}},
	}
	newData := jsonDoc.JsonDoc{"id": "root-1", "children": []interface{}{}}
	diffs := jsonDoc.DiffDocs(newData, currentData, []string{})
	request := upsertViewData(view, newData, currentData, removalRawData("root-1", "value-1", "edge-value-1"), diffs, "root-1", "tx-1")

	assert.Equal(t, len(request.Delete.Vertices), 1)
	assert.Equal(t, request.Delete.Vertices[0].OriginalId, "value-1")
}

func TestUpsertViewData_ISRRemoval_ValueObjectCanDelink(t *testing.T) {
	view := isrRemovalTestView(false, true)
	currentData := jsonDoc.JsonDoc{
		"id": "root-1",
		"children": []interface{}{jsonDoc.JsonDoc{
			"id": "value-1", "__entityId": "root-entity-1",
			"__metadata": jsonDoc.JsonDoc{"__isEntity": false, "__label": "child"},
		}},
	}
	newData := jsonDoc.JsonDoc{"id": "root-1", "children": []interface{}{}}
	rawData := removalRawData("root-1", "value-1", "edge-value-1")
	diffs := jsonDoc.DiffDocs(newData, currentData, []string{})
	request := upsertViewData(view, newData, currentData, rawData, diffs, "root-1", "tx-1")

	assert.Equal(t, len(request.Update.Vertices), 1)
	assert.Assert(t, reflect.DeepEqual(request.Update.Vertices[0].ViewManagedEdges, []string{"edge-value-1"}))
	assert.Equal(t, len(request.Delete.Vertices), 0)
}

func TestUpsertViewData_ISRRemoval_MultipleChildrenShareParentUpdate(t *testing.T) {
	view := isrRemovalTestView(true, false)
	currentData := jsonDoc.JsonDoc{
		"id": "root-1",
		"children": []interface{}{
			jsonDoc.JsonDoc{"id": "child-1", "__entityId": "child-e-1", "__metadata": jsonDoc.JsonDoc{"__isEntity": true, "__label": "child"}},
			jsonDoc.JsonDoc{"id": "child-2", "__entityId": "child-e-2", "__metadata": jsonDoc.JsonDoc{"__isEntity": true, "__label": "child"}},
		},
	}
	newData := jsonDoc.JsonDoc{"id": "root-1", "children": []interface{}{}, "status": "changed"}
	rawData := jsonDoc.JsonDoc{"data": jsonDoc.JsonDoc{"edges": []interface{}{
		jsonDoc.JsonDoc{"id": "edge-1", "from": "root-1", "to": "child-1", "__label": "contains"},
		jsonDoc.JsonDoc{"id": "edge-2", "from": "root-1", "to": "child-2", "__label": "contains"},
	}}}
	diffs := jsonDoc.DiffDocs(newData, currentData, []string{})
	request := upsertViewData(view, newData, currentData, rawData, diffs, "root-1", "tx-1")

	assert.Equal(t, len(request.Update.Vertices), 1)
	assert.Assert(t, reflect.DeepEqual(request.Update.Vertices[0].ViewManagedEdges, []string{"edge-1", "edge-2"}))
}

func isrRemovalTestView(childEntity bool, delinkOnRemoval bool) apiMessages.ViewQuery {
	return apiMessages.ViewQuery{
		RootKey: "id",
		RootElement: apiMessages.ViewElement{
			Object: "root", DocPathName: "root", QueryObjectId: "root", IsEntity: true,
			SubElements: []apiMessages.ViewElement{{
				Object: "child", DocPathName: "children", QueryObjectId: "child",
				RelationFromParent: "contains", IsEntity: childEntity, IsCollection: true,
				DelinkOnRemoval: delinkOnRemoval,
			}},
		},
	}
}

func removalRawData(parentID string, childID string, edgeID string) jsonDoc.JsonDoc {
	return jsonDoc.JsonDoc{"data": jsonDoc.JsonDoc{"edges": []interface{}{
		jsonDoc.JsonDoc{"id": edgeID, "from": parentID, "to": childID, "__label": "contains"},
	}}}
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
