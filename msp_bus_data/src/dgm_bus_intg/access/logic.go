package access

import (
	"dgm_bus_intg/jsonDoc"
)

func IfElse[E interface{}](cond bool, trueVal E, falseVal E) E {
	if cond {
		return trueVal
	}
	return falseVal
}

func DefaultJson[E jsonDoc.JsonDoc](val E, defaultVal E) E {
	if val == nil {
		return defaultVal
	}
	return val
}

func DefaultJsonString[E jsonDoc.JsonDoc](val E, prop string, defaultVal string) string {
	if val == nil || val[prop] == nil {
		return defaultVal
	}
	return val[prop].(string)
}
