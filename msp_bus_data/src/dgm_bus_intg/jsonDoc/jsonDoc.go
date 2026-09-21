package jsonDoc

import "slices"

type JsonDoc = map[string]interface{}

func JsonObjByValue(docArray []JsonDoc, propName string, value string) (JsonDoc, bool) {
	idx := slices.IndexFunc(docArray, func(o JsonDoc) bool { return o[propName] == value })
	if idx < 0 {
		return nil, false
	}
	return docArray[idx], true
}

func JsonObjsByValue[V string | bool | int | float64](docArray []JsonDoc, propName string, value V) []JsonDoc {
	var found []JsonDoc
	for _, doc := range docArray {
		if doc[propName] == value {
			found = append(found, doc)
		}
	}
	return found
}

func DocElementFromObject(obj JsonDoc, includeMetaData bool) JsonDoc {
	outElement := cloneJsonDoc(obj["content"].(JsonDoc))
	outElement["__entityId"] = obj["__entityId"]
	outElement["id"] = obj["id"]

	if includeMetaData {
		metaDataObj := JsonDoc{}
		metaDataObj["__label"] = obj["__label"]
		metaDataObj["__originalId"] = obj["__originalId"]
		metaDataObj["__timeStamp"] = obj["__timeStamp"]
		metaDataObj["__transactionId"] = obj["__transactionId"]
		metaDataObj["__viewType"] = obj["__viewType"]
		outElement["__metadata"] = metaDataObj
	}
	return outElement
}

// cloneJsonDoc gives each View branch its own document map. A graph query may
// reach the same vertex through multiple relations; sharing the content map
// between branches would make a finite JSON response cyclic when one branch
// contains another View path.
func cloneJsonDoc(source JsonDoc) JsonDoc {
	clone := JsonDoc{}
	for key, value := range source {
		clone[key] = cloneJsonValue(value)
	}
	return clone
}

func cloneJsonValue(value interface{}) interface{} {
	switch typed := value.(type) {
	case JsonDoc:
		return cloneJsonDoc(typed)
	case []interface{}:
		cloned := make([]interface{}, len(typed))
		for index, item := range typed {
			cloned[index] = cloneJsonValue(item)
		}
		return cloned
	default:
		return value
	}
}

func Map[T, V any](ts []T, fn func(T) V) []V {
	result := make([]V, len(ts))
	for i, t := range ts {
		result[i] = fn(t)
	}
	return result
}

func DocElementsFromJsonArray(arr []interface{}) []JsonDoc {
	docs := Map(arr, func(d interface{}) map[string]interface{} { return d.(JsonDoc) })

	return docs
}
