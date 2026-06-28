package jsonDoc

import (
	"dgm_bus_intg/utils"
)

func AddTmpIdToJSON(data map[string]interface{}) (map[string]interface{}, error) {
	// Add UUID to this object
	if (data["id"] == nil || data["id"].(string) == "") && (data["__tmpId"] == nil || data["__tmpId"].(string) == "") {
		id := utils.GenerateId()
		data["__tmpId"] = id
	}
	for i := range data {
		switch v := data[i].(type) {
		case map[string]interface{}:
			// Generate a new UUID for this object
			if (v["id"] == nil || v["id"].(string) == "") && (v["__tmpId"] == nil || v["__tmpId"].(string) == "") {
				id := utils.GenerateId()
				v["__tmpId"] = id
			}

			// Recursively process nested objects and arrays
			for _, value := range v {
				switch nested := value.(type) {
				case map[string]interface{}:
					processObject(nested)
				case []interface{}:
					processArray(nested)
				}
			}

		case []interface{}:
			processArray(v)
		}
	}
	return data, nil
}

func processObject(obj map[string]interface{}) {
	// Add UUID to this object
	if (obj["id"] == nil || obj["id"].(string) == "") && (obj["__tmpId"] == nil || obj["__tmpId"].(string) == "") {
		id := utils.GenerateId()
		obj["__tmpId"] = id
	}

	// Process nested elements
	for _, value := range obj {
		switch nested := value.(type) {
		case map[string]interface{}:
			processObject(nested)
		case []interface{}:
			processArray(nested)
		}
	}
}

func processArray(arr []interface{}) {
	for _, value := range arr {
		switch nested := value.(type) {
		case map[string]interface{}:
			processObject(nested)
		case []interface{}:
			processArray(nested)
		}
	}
}
