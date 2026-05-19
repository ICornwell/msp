package access

import (
	"dgm_bus_intg/apiMessages"
	"dgm_bus_intg/jsonDoc"
)

func graphToDoc(viewSpec apiMessages.ViewQuery, graphObjects jsonDoc.JsonDoc, rootKey string, includeMetaData bool) jsonDoc.JsonDoc {
	// kick off the recursice doc hierarchy builder
	doc, ok := recursiveGraphToDoc(viewSpec.RootElement, graphObjects, "__entityId", rootKey, includeMetaData)

	if !ok {
		return jsonDoc.JsonDoc{}
	}
	return doc
}

func recursiveGraphToDoc(viewSpec apiMessages.ViewElement, graphObjects jsonDoc.JsonDoc,
	keyProp string, key string, includeMetaData bool) (jsonDoc.JsonDoc, bool) {

	// get the vertex list in a more searchable form
	data := graphObjects["data"].(map[string]interface{})

	vertices := jsonDoc.DocElementsFromJsonArray(data["vertices"].([]interface{}))

	// vertices is used later for enumerating children
	// so we use a copy here, so the entityid/isentity logic doesn't
	// impact that
	rootVertices := vertices
	// find the item we're working on - nb first time in this is the top of the hierarchy
	// if we are searching by an _entityId, then make sure we have the isEntity version
	// after that we're just getting the next one by id (found from a parent edge)
	if (keyProp == "__entityId") {
		rootVertices = jsonDoc.JsonObjsByValue(rootVertices, "__isEntity", true)
		if len(rootVertices) == 0 {
			return nil, false
		}
	}
	rootObject, ok := jsonDoc.JsonObjByValue(rootVertices, keyProp, key)

	if !ok {
		return nil, false
	}
	// get an easily searchable list of edges coming from the object being processed
	edges := jsonDoc.JsonObjsByValue(jsonDoc.DocElementsFromJsonArray(data["edges"].([]interface{})), "from", rootObject["id"].(string))

	// create the doc element for this object
	outDoc := jsonDoc.DocElementFromObject(rootObject, includeMetaData)

	// check the View spec. for sub-elements that need to be included
	for _, subElement := range viewSpec.SubElements {
		objColl := []interface{}{}
		// find edges that match the sub-element
		subEdges := jsonDoc.JsonObjsByValue(edges, "__label", subElement.RelationFromParent)
		for _, es := range subEdges {
			// find the graph vertices that come from the sub-element edges
			nextObjs := jsonDoc.JsonObjsByValue(vertices, "id", es["to"].(string))
			for _, nextObj := range nextObjs {
				// recurse in the process the sub-element vertices
				childElement, ok := recursiveGraphToDoc(subElement, graphObjects, "id", nextObj["id"].(string), includeMetaData)
				// add the found sub parts to the current doc element (just collect them if we're building an array type part)
				if ok {
					if subElement.IsCollection {
						objColl = append(objColl, childElement)
					} else {
						outDoc[subElement.Object] = childElement
					}
				}
			}
		}
		// add the array type part if relevant
		if subElement.IsCollection {
			outDoc[subElement.Object] = objColl
		}
	}

	// return the doc part
	return outDoc, true
}
