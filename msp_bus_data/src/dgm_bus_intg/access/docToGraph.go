package access

import (
	"dgm_bus_intg/apiMessages"
	"dgm_bus_intg/jsonDoc"
	"dgm_bus_intg/outbound"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"reflect"
	"slices"
)

func RunUpsert(uq apiMessages.UpsertQuery, key string, callType string, transactionId string, transactionToken string) (apiMessages.UpsertResponse, error) {
	view := uq.View
	data, _ := jsonDoc.AddTmpIdToJSON(uq.Data)

	// load the current state
	currentDocData, rawData, err := RunQuery(view, key, true, transactionToken, transactionToken != "")

	if err != nil {
		return apiMessages.UpsertResponse{}, err
	}

	difCurrent := currentDocData
	if len(currentDocData) == 0 {
		difCurrent = nil
	}
	entitiesList := GetEntityListFromView(data, difCurrent, view)

	diffs := jsonDoc.DiffDocs(data, difCurrent, entitiesList)

	request := upsertViewData(view, data, currentDocData, rawData, diffs, key, transactionId)

	if callType == "preview" {
		log.Printf("Upsert preview request: %+v", request)
		return apiMessages.UpsertResponse{
			IsSuccess: true,
			Message:   fmt.Sprintf("Preview - upsert request built with %d adds, %d updates, %d deletes", len(request.Add.Vertices), len(request.Update.Vertices), len(request.Delete.Vertices)),
			Request:   request,
		}, nil
	}

	responseBody, err := outbound.OutBoundRequestWithOptions(
		http.MethodPut,
		outbound.OutBoundRequestType_Update,
		request,
		map[string]string{"tid": transactionId},
	)

	if err != nil {
		return apiMessages.UpsertResponse{
			IsSuccess: false,
			Message:   err.Error(),
			EntityIds: []apiMessages.KeyIdPair{{Key: "__none__", Id: "__none__"}},
			Request:   request,
		}, fmt.Errorf("upsert failed with error: %s", err.Error())
	}

	var graphUpdateResponse apiMessages.GraphUpdateResponse
	err2 := json.Unmarshal(responseBody, &graphUpdateResponse)
	if err2 != nil {
		return apiMessages.UpsertResponse{
			IsSuccess: false,
			Message:   err2.Error(),
			EntityIds: []apiMessages.KeyIdPair{{Key: "__none__", Id: "__none__"}},
			Request:   request,
		}, fmt.Errorf("upsert failed with error: %s", err2.Error())
	}

	if !graphUpdateResponse.IsSuccess {
		return apiMessages.UpsertResponse{
			IsSuccess: false,
			Message:   graphUpdateResponse.Message,
			EntityIds: []apiMessages.KeyIdPair{{Key: "__none__", Id: "__none__"}},
			Request:   request,
		}, fmt.Errorf("upsert failed with error: %s", graphUpdateResponse.Message)
	}

	return apiMessages.UpsertResponse{
		IsSuccess: true,
		Message:   "success",
		EntityIds: graphUpdateResponse.EntityIds,
		Request:   request,
	}, nil
}

func upsertViewData(view apiMessages.ViewQuery,
	newData jsonDoc.JsonDoc,
	currentData jsonDoc.JsonDoc,
	rawData jsonDoc.JsonDoc, diffs jsonDoc.DiffResult,
	key string,
	transactionId string) apiMessages.UpsertRequest {

	element := view.RootElement
	upsertRequest := apiMessages.UpsertRequest{}

	if element.DocPathName == "" {
		element.DocPathName = element.Object
	}
	recursiveUpsertViewData(element, nil, newData, nil, nil, currentData, nil, "", rawData, diffs, view.RootKey, transactionId, &upsertRequest)

	return upsertRequest
}

func recursiveUpsertViewData(viewElement apiMessages.ViewElement,
	parentViewElement *apiMessages.ViewElement,
	newData jsonDoc.JsonDoc,
	parentNewData jsonDoc.JsonDoc,
	parentStrippedContent map[string]interface{},
	currentData jsonDoc.JsonDoc,
	parentCurrentData jsonDoc.JsonDoc,
	currentEntityId string,
	rawData jsonDoc.JsonDoc,
	diffs jsonDoc.DiffResult,
	rootKeyName string,
	transactionId string,
	request *apiMessages.UpsertRequest) {

	// we should always have either an id or a __tmpId
	
	var id = jsonDoc.GetId(newData)

	var parentId = jsonDoc.GetId(parentNewData)

	subNames := map[string]bool{}
	for i, v := range viewElement.SubElements {
		if v.DocPathName == "" {
			viewElement.SubElements[i].DocPathName = v.Object
		}

		subNames[viewElement.SubElements[i].DocPathName] = true
	}

	strippedContent := map[string]interface{}{}
	for k, v := range newData {
		_, ok := subNames[k]
		if !ok {
			strippedContent[k] = v
		}
	}

	currentStrippedContent := map[string]interface{}{}
	for k, v := range currentData {
		_, ok := subNames[k]
		if !ok || k == "__tmpId" {
			currentStrippedContent[k] = v
		}
	}

	if id != nil {
		// take the string value of the id/tmpId
		idString := id.(string)

		if diffs.IsNewObject(idString) {
			primaryBusinessKey := ""
			// get the precalculated business key from the new data, if it is an entity
			if viewElement.IsEntity {
				primaryBusinessKey = jsonDoc.FromContent[string](newData, "__businessKey")
			}
			tmpId := jsonDoc.FromContent[string](newData, "__tmpId")

			if viewElement.IsEntity || currentEntityId == "" {
				currentEntityId = tmpId
			}
			hasExistingAddVertex := slices.IndexFunc(request.Add.Vertices, func(v *apiMessages.Vertex) bool {
				return v != nil && v.TmpId != "" && v.TmpId == tmpId
			}) >= 0

			if !hasExistingAddVertex {
				request.Add.Vertices = append(request.Add.Vertices, &apiMessages.Vertex{
					Label:         viewElement.Object,
					IsEntity:      viewElement.IsEntity,
					TransactionId: transactionId,
					ViewType:      jsonDoc.FromMetaData[string](newData, "__viewType"),
					QueryObjectId: viewElement.QueryObjectId,
					Content:       strippedContent,
					AlternateKey:  "",
					BusinessKey:   primaryBusinessKey,
					TmpId:         tmpId,
					EntityId:      currentEntityId,
				})
			}
			if parentNewData != nil {
				parentIdString, _ := parentId.(string)
				edges := relationEdgesForViewElement(viewElement, parentIdString, idString)
				for _, edge := range edges {
					request.Add.Edges = append(request.Add.Edges, &apiMessages.Edge{
						Label:         edge.label,
						TransactionId: transactionId,
						From:          edge.from,
						To:            edge.to,
						ViewType:      jsonDoc.FromMetaData[string](newData, "__viewType"),
						Content:       map[string]interface{}{},
					})
				}
			}
		} else if diffs.IsUpdatedObject(idString) {
			if viewElement.IsEntity || currentEntityId == "" {
				currentEntityId = jsonDoc.FromContent[string](newData, "__tmpId")
			}
			updateObj := diffs.UpdateMap[idString]
			oldData := updateObj.OldObject
			previousId := oldData["id"].(string)
			hasExistingUpdateVertex := slices.IndexFunc(request.Update.Vertices, func(v *apiMessages.Vertex) bool {
				return v != nil && v.PreviousId != "" && v.PreviousId == previousId
			}) >= 0

			if !hasExistingUpdateVertex {
				request.Update.Vertices = append(request.Update.Vertices, &apiMessages.Vertex{
					Label:         viewElement.Object,
					TransactionId: transactionId,
					EntityId:      jsonDoc.FromContent[string](newData, "__entityId"),
					ViewType:      jsonDoc.FromMetaData[string](newData, "__viewType"),
					PreviousId:    previousId,
					OriginalId:    jsonDoc.FromMetaData[string](oldData, "__originalId"),
					QueryObjectId: viewElement.QueryObjectId,
					IsEntity:      viewElement.IsEntity,
					Content:       strippedContent,
				})
			}
		}
		for _, v := range viewElement.SubElements {
			newObj := newData[v.DocPathName]
			currObj := currentData[v.DocPathName]
			if newObj != nil { // can be nil when data has been removed/deleted
				t := reflect.TypeOf(newObj).Kind()

				// we have an array of child/sub elements:
				if t == reflect.Slice {
					// hideous casting abound! sorry, json handling is a little messy
					for _, n := range newObj.([]interface{}) {
						na := n.(jsonDoc.JsonDoc)
						oai := -1
						var oa jsonDoc.JsonDoc = nil
						if currObj != nil {
							currDoc := currObj.([]interface{})
							// looking up an array item with matching index from new data in the current data
							oai = slices.IndexFunc(currDoc,
								func(o interface{}) bool { return o.(jsonDoc.JsonDoc)["id"] == na["id"] })

							if oai >= 0 {
								oa = currDoc[oai].(jsonDoc.JsonDoc)
							}
						}
						recursiveUpsertViewData(v,
							&viewElement,
							na, newData,
							strippedContent, oa, currentData, currentEntityId,
							rawData, diffs, rootKeyName, transactionId, request)
					}
					if currObj != nil { // can bw nil for new items
					for _, o := range currObj.([]interface{}) {
						oa := o.(jsonDoc.JsonDoc)
						oai := -1
						
						
							newDoc := newObj.([]interface{})
							// looking up an array item with matching index from current data in the new data
							oai = slices.IndexFunc(newDoc,
								func(n interface{}) bool { return n.(jsonDoc.JsonDoc)["id"] == oa["id"] })

							if oai < 0 {
								id := oa["id"]
								if id != nil {
									removedCurrentStrippedContent := strippedContentForViewElement(v, oa)
									// Relationship removal must be handled even when the same child object
									// still exists elsewhere in the document hierarchy.
									handleRemoval(request, v, transactionId, oa,
										removedCurrentStrippedContent, newData, currentData, strippedContent,
										rawData)
								}
							}
						}
					}
				} else {
					// much simpler where the child is a single item
					var c jsonDoc.JsonDoc
					if currObj != nil {
						c = currObj.(jsonDoc.JsonDoc)
					}
					recursiveUpsertViewData(v, &viewElement,
						newObj.(jsonDoc.JsonDoc), newData, strippedContent,
						c, currentData, currentEntityId,
						rawData, diffs, rootKeyName, transactionId, request)
				}
			} else {
				// old but no new - should cause a delete
				if currObj != nil {
					recursiveUpsertViewData(v, &viewElement,
						nil, newData, strippedContent,
						currObj.(jsonDoc.JsonDoc), currentData, currentEntityId,
						rawData, diffs, rootKeyName, transactionId, request)
				} else {
					// Nothing existed previously for this optional child path.
					continue
				}
			}
		}
	} else {
		id := currentData["id"]
		if id != nil {

			handleRemoval(request, viewElement, transactionId, currentData, currentStrippedContent,
				parentNewData, parentCurrentData, parentStrippedContent, rawData)
			// TODO: see above TODO about handling deletes of enity and non-entity children
			// request.Delete.Vertices = append(request.Delete.Vertices, &apiMessages.Vertex{
			// 	Label:         viewElement.Object,
			// 	TransactionId: transactionId,
			// 	ViewType:      fromMetaData[string](currentData, "__viewType"),
			// 	QueryObjectId: viewElement.QueryObjectId,
			// 	OriginalId:    currentData["id"].(string),
			// 	PreviousId:    currentData["id"].(string),
			// 	IsEntity: viewElement.IsEntity,
			// 	Content:  currentStrippedContent,
			// })
		}
	}

}

func strippedContentForViewElement(viewElement apiMessages.ViewElement, data jsonDoc.JsonDoc) map[string]interface{} {
	strippedContent := map[string]interface{}{}
	if data == nil {
		return strippedContent
	}

	subNames := map[string]bool{}
	for _, v := range viewElement.SubElements {
		docPathName := v.DocPathName
		if docPathName == "" {
			docPathName = v.Object
		}
		subNames[docPathName] = true
	}

	for k, v := range data {
		_, ok := subNames[k]
		if !ok || k == "__tmpId" {
			strippedContent[k] = v
		}
	}

	return strippedContent
}

func handleRemoval(request *apiMessages.UpsertRequest, viewElement apiMessages.ViewElement,
	 transactionId string, vertex jsonDoc.JsonDoc,
	  currentStrippedContent map[string]interface{},
		parentData jsonDoc.JsonDoc, parentCurrentData jsonDoc.JsonDoc, parentStrippedContent  map[string]interface{},
		rawData jsonDoc.JsonDoc)  {
	delinkOnly := shouldDelinkOnRemoval(viewElement, vertex)
	if parentData == nil || parentCurrentData == nil {
		if !delinkOnly {
			request.Delete.Vertices = append(request.Delete.Vertices, &apiMessages.Vertex{
				Label:         viewElement.Object,
				TransactionId: transactionId,
				ViewType:      jsonDoc.FromMetaData[string](vertex, "__viewType"),
				EntityId:      jsonDoc.FromContent[string](vertex, "__entityId"),
				QueryObjectId: viewElement.QueryObjectId,
				OriginalId:    vertex["id"].(string),
				PreviousId:    vertex["id"].(string),
				IsEntity:      viewElement.IsEntity,
				Content:       currentStrippedContent,
			})
		}
		return
	}

	parentVertexId := jsonDoc.FromContent[string](parentCurrentData, "id")
	if parentVertexId == "" {
		parentVertexId = jsonDoc.FromContent[string](parentCurrentData, "__entityId")
	}
	parentEntityId := jsonDoc.FromContent[string](parentData, "__entityId")
	if parentEntityId == "" {
		parentEntityId = jsonDoc.FromContent[string](parentCurrentData, "__entityId")
	}
	parentTmpID := jsonDoc.FromContent[string](parentData, "__tmpId")
	if parentTmpID == "" {
		parentTmpID = jsonDoc.FromContent[string](parentCurrentData, "__tmpId")
	}
	if parentVertexId != "" {
		existingUpdateIdx := slices.IndexFunc(request.Update.Vertices, func(v *apiMessages.Vertex) bool {
			if v == nil {
				return false
			}
			if v.PreviousId != "" && v.PreviousId == parentVertexId {
				return true
			}
			if v.EntityId != "" && parentEntityId != "" && v.EntityId == parentEntityId {
				return true
			}
			return parentTmpID != "" && v.TmpId == parentTmpID
		})

		removedVertexId := vertex["id"].(string)
		relationLabels := relationLabelsForViewElement(viewElement)
		parentLabel := jsonDoc.FromMetaData[string](parentData, "__label")
		if parentLabel == "" {
			parentLabel = viewElement.Object
		}

		var existingUpdateVertex *apiMessages.Vertex = nil
		if existingUpdateIdx >= 0 {
			existingUpdateVertex = request.Update.Vertices[existingUpdateIdx]
		} else {
			parentQueryObjectId := jsonDoc.FromMetaData[string](parentData, "__queryObjectId")
			if parentQueryObjectId == "" {
				parentQueryObjectId = jsonDoc.FromMetaData[string](parentCurrentData, "__queryObjectId")
			}
			parentIsEntity := jsonDoc.FromMetaData[bool](parentData, "__isEntity")
			if !parentIsEntity {
				parentIsEntity = jsonDoc.FromMetaData[bool](parentCurrentData, "__isEntity")
			}
			existingUpdateVertex = &apiMessages.Vertex{
				Label:         parentLabel,
				TransactionId: transactionId,
				EntityId:      parentEntityId,
				TmpId:         parentTmpID,
				ViewType:      jsonDoc.FromMetaData[string](parentData, "__viewType"),
				PreviousId:    parentVertexId,
				OriginalId:    jsonDoc.FromMetaData[string](parentData, "__originalId"),
				QueryObjectId: parentQueryObjectId,
				IsEntity:      parentIsEntity,
				Content:       parentStrippedContent,
			}
			request.Update.Vertices = append(request.Update.Vertices, existingUpdateVertex)
		}
		if existingUpdateVertex.ViewManagedEdges == nil {
			existingUpdateVertex.ViewManagedEdges = []string{}
		}
		edgeIDs := getEdgeIds(parentVertexId, removedVertexId, relationLabels, rawData)
		if len(edgeIDs) == 0 {
			edgeIDs = getEdgeIds(parentVertexId, removedVertexId, nil, rawData)
		}
		for _, edgeID := range edgeIDs {
			if !slices.Contains(existingUpdateVertex.ViewManagedEdges, edgeID) {
				existingUpdateVertex.ViewManagedEdges = append(existingUpdateVertex.ViewManagedEdges, edgeID)
			}
		}
	}

	if !delinkOnly {
		request.Delete.Vertices = append(request.Delete.Vertices, &apiMessages.Vertex{
			Label:         viewElement.Object,
			TransactionId: transactionId,
			ViewType:      jsonDoc.FromMetaData[string](vertex, "__viewType"),
			EntityId:      jsonDoc.FromContent[string](vertex, "__entityId"),
			QueryObjectId: viewElement.QueryObjectId,
			OriginalId:    vertex["id"].(string),
			PreviousId:    vertex["id"].(string),
			IsEntity:      viewElement.IsEntity,
			Content:       currentStrippedContent,
		})
	}
}

func shouldDelinkOnRemoval(viewElement apiMessages.ViewElement, vertex jsonDoc.JsonDoc) bool {
	if jsonDoc.FromMetaData[bool](vertex, "__isEntity") {
		return true
	}
	if viewElement.DelinkOnRemoval {
		return true
	}
	// Backward compatibility for legacy field name emitted by older clients.
	if viewElement.CascadeDeletes {
		return true
	}
	return false
}

type relationEdge struct {
	label string
	from  string
	to    string
}

func relationEdgesForViewElement(viewElement apiMessages.ViewElement, parentId string, childId string) []relationEdge {
	edges := []relationEdge{}
	if viewElement.RelationFromParent != "" {
		edges = append(edges, relationEdge{label: viewElement.RelationFromParent, from: parentId, to: childId})
	}
	if viewElement.RelationToParent != "" {
		edges = append(edges, relationEdge{label: viewElement.RelationToParent, from: childId, to: parentId})
	}
	return edges
}

func relationLabelsForViewElement(viewElement apiMessages.ViewElement) []string {
	labels := []string{}
	if viewElement.RelationFromParent != "" {
		labels = append(labels, viewElement.RelationFromParent)
	}
	if viewElement.RelationToParent != "" {
		labels = append(labels, viewElement.RelationToParent)
	}
	return labels
}

func getEdgeIds(vertexId1 string, vertexId2 string, relationLabels []string, rawData jsonDoc.JsonDoc) []string {
	var edgeIds []string
	allowedLabels := map[string]bool{}
	for _, label := range relationLabels {
		allowedLabels[label] = true
	}
	edges, ok := rawData["data"].(map[string]interface{})["edges"].([]interface{})
	if ok {
		for _, e := range edges {
			edge := e.(jsonDoc.JsonDoc)
			if len(allowedLabels) > 0 {
				edgeLabel, _ := edge["__label"].(string)
				if !allowedLabels[edgeLabel] {
					continue
				}
			}
			if (edge["from"] == vertexId1 && edge["to"] == vertexId2) ||
				(edge["from"] == vertexId2 && edge["to"] == vertexId1) {
				edgeId, hasId := edge["id"].(string)
				if !hasId {
					continue
				}
				if !slices.Contains(edgeIds, edgeId) {
					edgeIds = append(edgeIds, edgeId)
				}
				continue
			}
		}
	}
	return edgeIds
}

