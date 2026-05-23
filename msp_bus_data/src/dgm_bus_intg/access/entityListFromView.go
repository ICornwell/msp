package access

import (
	"dgm_bus_intg/apiMessages"
	"dgm_bus_intg/jsonDoc"
	"slices"
)

func GetEntityListFromView(newDoc interface{}, oldDoc interface{}, view apiMessages.ViewQuery) []string {

	entities := recurseGetEntityListFromView(newDoc, view.RootElement, []string{})
	entities = recurseGetEntityListFromView(oldDoc, view.RootElement, entities)
	return entities
}

func recurseGetEntityListFromView(doc interface{},
	element apiMessages.ViewElement, entities []string) []string {

	var arrayDoc []interface{}
	if isArray(interface{}(doc)) {
		arrayDoc = interface{}(doc).([]interface{})
	} else {
		arrayDoc = []interface{}{doc}
	}
	for _, member := range arrayDoc {
		if member == nil {
			continue
		}
		if element.IsEntity {
			if !slices.Contains(entities, element.Object) {
				entities = append(entities, element.Object)
			}
			if member.(map[string]interface{}) == nil {
				return entities
			}
			addIsEntityMetadata(member.(map[string]interface{}))
		}
		if !isPrimative(member) {
			for _, child := range element.SubElements {
				path := child.DocPathName
				if path == "" {
					path = child.Object
				}
				subDoc := member.(jsonDoc.JsonDoc)[path]
				if !isPrimative(subDoc) {
					entities = recurseGetEntityListFromView(subDoc, child, entities)
				}
			}
		}
	}
	return entities
}

func isPrimative(value interface{}) bool {
	switch value.(type) {
	case int, float32, float64, string, bool:
		return true
	default:
		return false
	}
}

func isArray(value interface{}) bool {
	switch value.(type) {
	case []interface{}:
		return true
	default:
		return false
	}
}

func addIsEntityMetadata(value map[string]interface{}) {
	if value["__metaData"] == nil {
		value["__metaData"] = map[string]interface{}{}
	}
	metaData := value["__metaData"].(map[string]interface{})
	metaData["__isEntity"] = true
}
