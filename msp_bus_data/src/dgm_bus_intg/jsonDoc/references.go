package jsonDoc

import "fmt"

const ISRReferenceKey = "__mspReference"

type ISRReference struct {
	Object      string
	ID          string
	TmpID       string
	EntityID    string
	BusinessKey string
}

func GetISRReference(data JsonDoc) (ISRReference, bool) {
	raw, ok := data[ISRReferenceKey]
	if !ok {
		return ISRReference{}, false
	}
	reference, ok := raw.(JsonDoc)
	if !ok {
		return ISRReference{}, false
	}

	return ISRReference{
		Object:      FromContent[string](reference, "object"),
		ID:          FromContent[string](reference, "id"),
		TmpID:       FromContent[string](reference, "tmpId"),
		EntityID:    FromContent[string](reference, "entityId"),
		BusinessKey: FromContent[string](reference, "businessKey"),
	}, true
}

func IsISRReference(data JsonDoc) bool {
	_, ok := GetISRReference(data)
	return ok
}

func IdentityKey(data JsonDoc) string {
	if reference, ok := GetISRReference(data); ok {
		if reference.ID != "" {
			return fmt.Sprintf("id:%s:%s", reference.Object, reference.ID)
		}
		if reference.EntityID != "" {
			return fmt.Sprintf("entity:%s:%s", reference.Object, reference.EntityID)
		}
		if reference.TmpID != "" {
			return fmt.Sprintf("tmp:%s:%s", reference.Object, reference.TmpID)
		}
		if reference.BusinessKey != "" {
			return fmt.Sprintf("business:%s:%s", reference.Object, reference.BusinessKey)
		}
		return ""
	}

	objectType := FromMetaData[string](data, "__label")
	if objectType == "" {
		objectType = FromContent[string](data, "__label")
	}
	if isEntity := FromMetaData[bool](data, "__isEntity"); isEntity {
		if entityID := FromContent[string](data, "__entityId"); entityID != "" {
			return fmt.Sprintf("entity:%s:%s", objectType, entityID)
		}
	}
	if id := FromContent[string](data, "id"); id != "" {
		return fmt.Sprintf("id:%s:%s", objectType, id)
	}
	if tmpID := FromContent[string](data, "__tmpId"); tmpID != "" {
		return fmt.Sprintf("tmp:%s:%s", objectType, tmpID)
	}
	if businessKey := FromContent[string](data, "__businessKey"); businessKey != "" {
		return fmt.Sprintf("business:%s:%s", objectType, businessKey)
	}
	return ""
}

func ISRReferenceTarget(data JsonDoc) (string, bool) {
	reference, ok := GetISRReference(data)
	if !ok {
		return "", false
	}
	if reference.ID != "" {
		return reference.ID, true
	}
	if reference.EntityID != "" {
		return reference.EntityID, true
	}
	if reference.TmpID != "" {
		return reference.TmpID, true
	}
	return "", false
}
