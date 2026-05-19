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

func JsonObjsByValue[V string| bool | int | float64] (docArray []JsonDoc, propName string, value V)  ( []JsonDoc) {
	var found []JsonDoc
	for _, doc := range docArray {
		if doc[propName] == value {
			found = append(found, doc)
		}
	}
	return found
}

func DocElementFromObject(obj JsonDoc, includeMetaData bool) JsonDoc {
	outElement := obj["content"].(JsonDoc)
	outElement["__entityId"] = obj["__entityId"]
	outElement["id"] = obj["id"]

	if includeMetaData {
		metaDataObj := JsonDoc{}
		metaDataObj["__label"] = obj["__label"]
		metaDataObj["__originalId"] = obj["__originalId"]
		metaDataObj["__timeStamp"] = obj["__timeStamp"]
		metaDataObj["__transactionId"] = obj["__transactionId"]
		metaDataObj["__viewType"] = obj["__viewType"]
		outElement["__metaData"] = metaDataObj
	}
	return outElement
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
