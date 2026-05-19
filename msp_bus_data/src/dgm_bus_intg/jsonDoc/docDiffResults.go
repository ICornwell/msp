package jsonDoc

import (
	"slices"
)

type DiffResult struct {
	NewObjects     []NewObject
	UpdatedObjects []UpdatedObject
	DeletedObjects []DeletedObject
	AddMap         map[string]*NewObject
	UpdateMap      map[string]*UpdatedObject
	DeleteMap      map[string]*DeletedObject
}

func NewDiffResult() DiffResult {
	return DiffResult{
		NewObjects:     []NewObject{},
		UpdatedObjects: []UpdatedObject{},
		DeletedObjects: []DeletedObject{},
		AddMap:         map[string]*NewObject{},
		UpdateMap:      map[string]*UpdatedObject{},
		DeleteMap:      map[string]*DeletedObject{},
	}
}

func (result DiffResult) AddNewObject(obj JsonDoc) DiffResult {
	tmpId := obj["__tmpId"].(string)
	newObject := NewObject{

		ObjectDesciptor: ObjectDesciptor{
			Label:    FromMetaData[string](obj, "__label"),
			ViewType: FromMetaData[string](obj, "__viewType"),
		},
		Object: obj,
	}

	// we might already have this obj in the list, so check first
	// this happens when new objects are added, and they have sub elements
	
	exists := slices.IndexFunc(result.NewObjects,
		func(no NewObject) bool { return no.Object["__tmpId"] == tmpId }) >= 0

	if !exists {
		result.NewObjects = append(result.NewObjects, newObject)
	}

	result.AddMap[tmpId] = &newObject
	return result
}

func (result DiffResult) AddUpdatedObject(obj JsonDoc, newObj JsonDoc) DiffResult {
	// we might already have this obj in the list, so check first
	exists := slices.IndexFunc(
		result.UpdatedObjects,
		func(uo UpdatedObject) bool { return uo.Id == FromContent[string](obj, "id") }) >= 0
		
	if exists {
		return result
	}
	updateObj := UpdatedObject{

		ObjectDesciptor: ObjectDesciptor{
			Id:       FromContent[string](obj, "id"),
			EntityId: FromContent[string](obj, "__entityId"),
			Label:    FromMetaData[string](obj, "__label"),
			ViewType: FromMetaData[string](obj, "__viewType"),
			OriginalId: FromMetaData[string](obj, "__originalId"),
		},
		Object:    newObj,
		OldObject: obj,
	}
	result.UpdatedObjects = append(result.UpdatedObjects, updateObj)
	result.UpdateMap[updateObj.Id] = &updateObj
	return result
}

func (result DiffResult) AddDeletedObject(obj JsonDoc) DiffResult {
	deletedObject := DeletedObject{

		ObjectDesciptor: ObjectDesciptor{
			Id:       FromContent[string](obj, "id"),
			EntityId: FromContent[string](obj, "__entityId"),
			Label:    FromMetaData[string](obj, "__label"),
			ViewType: FromMetaData[string](obj, "__viewType"),
		},
		OldObject: obj,
	}
	result.DeletedObjects = append(result.DeletedObjects, deletedObject)
	result.DeleteMap[deletedObject.Id] = &deletedObject
	return result
}

func (result DiffResult) IsNewObject(id string) bool {
	return result.AddMap[id] != nil
}

func (result DiffResult) IsUpdatedObject(id string) bool {
	return result.UpdateMap[id] != nil
}

func (result DiffResult) IsDeletedObject(id string) bool {
	return result.DeleteMap[id] != nil
}




type ObjectDesciptor struct {
	Id       string
	EntityId string
	Label    string
	ViewType string
	OriginalId string
}

type NewObject struct {
	ObjectDesciptor
	Object map[string]interface{}
}

type UpdatedObject struct {
	ObjectDesciptor
	Object    map[string]interface{}
	OldObject map[string]interface{}
}

type DeletedObject struct {
	ObjectDesciptor
	OldObject map[string]interface{}
}
