package jsonDoc

func GetId(data map[string]interface{}) interface{} {
	var id interface{} = nil
	if data != nil {
		id = data["id"]
		if id == nil && data["__tmpId"] != nil {
			id = data["__tmpId"]
		}
	}
	return id
}

type JsonPrimatives interface {
	int | float32 | float64 | string | bool
}

func FromMetaData[T JsonPrimatives](obj map[string]interface{}, key string) T {
	meta, ok := obj["__metadata"]
	if ok {
		md := meta.(map[string]interface{})
		val, ok := md[key].(T)
		if ok {
			return val
		}
	}
	var zero T
	return zero
}

func FromContent[T JsonPrimatives](obj map[string]interface{}, key string) T {
	v, ok := obj[key]
	if ok {
		return v.(T)
	}
	var zero T
	return zero
}
