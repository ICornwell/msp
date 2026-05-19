package jsonDoc

import (
	"encoding/json"
	"testing"

	"gotest.tools/assert"
)

var example = `{
    "__entityId": "ex23",
    "accountNumber": "acc-001",
    "id": "ac001",
    "openedDate": "2004-10-21T10:41:00Z",
    "order": [
        {
            "__entityId": "ex23",
            "id": "ord01",
            "orderDate": "2004-10-21T15:00:00Z",
            "orderItem": [
                {
                    "__entityId": "ex23",
                    "id": "orditem01",
                    "product": {
                        "__entityId": "p1",
                        "id": "prod01",
                        "name": "rubber chicken",
                        "sku": "rc-799-200/h"
                    },
                    "quantity": 2,
                    "unitPrice": 20.99
                },
                {
                    "__entityId": "ex23",
                    "id": "orditem02",
                    "product": {
                        "__entityId": "p2",
                        "id": "prod02",
                        "name": "tall hat",
                        "sku": "th-1000-2/a"
                    },
                    "quantity": 6,
                    "unitPrice": 7.5
                }
            ],
            "ref": "ord-001"
        },
        {
            "__entityId": "ex23",
            "id": "ord02",
            "openedDate": "2004-10-28T10:00:00Z",
            "orderItem": [
                {
                    "__entityId": "ex23",
                    "id": "orditem04",
                    "product": {
                        "__entityId": "p3",
                        "id": "prod03",
                        "name": "novelty pencil",
                        "sku": "np-9221-843/k"
                    },
                    "quantity": 4,
                    "unitPrice": 3.99
                },
                {
                    "__entityId": "ex23",
                    "id": "orditem03",
                    "product": {
                        "__entityId": "p1",
                        "id": "prod01",
                        "name": "rubber chicken",
                        "sku": "rc-799-200/h"
                    },
                    "quantity": 7,
                    "unitPrice": 20.99
                }
            ],
            "ref": "ord-002"
        }
    ],
    "person": {
        "__entityId": "ex83",
        "age": 26,
        "id": "px001",
        "name": "bob"
    },
    "type": "premium"
}`

var exampleSubElement = `{
    "__entityId": "sb1",
	"id": "sb1-id001",
    "subEleProp1": "abc",
	"subEleProp2": 100,
	"subEleProp3": true,
	"subEleProp4": 12.892
}`

var exampleNewSubElement = `{
    "subEleProp1": "abc",
	"subEleProp2": 100,
	"subEleProp3": true,
	"subEleProp4": 12.892
}`

func TestNoDiff(t *testing.T) {
	var newDoc map[string]any
	var oldDoc map[string]any
	json.Unmarshal([]byte(example), &newDoc)
	json.Unmarshal([]byte(example), &oldDoc)

	results := DiffDocs(newDoc, oldDoc, []string{})

	assert.Equal(t, len(results.UpdatedObjects), 0, "No Updates")
	assert.Equal(t, len(results.NewObjects), 0, "No Updates")
	assert.Equal(t, len(results.DeletedObjects), 0, "No Updates")
}

func TestUpdateRootObj(t *testing.T) {
	var newDoc map[string]any

	var oldDoc map[string]any
	json.Unmarshal([]byte(example), &newDoc)
	json.Unmarshal([]byte(example), &oldDoc)

	newDoc["type"] = "standard"

	results := DiffDocs(newDoc, oldDoc, []string{})

	assert.Equal(t, len(results.UpdatedObjects), 1, "One Update")
	assert.Equal(t, len(results.NewObjects), 0, "No Updates")
	assert.Equal(t, len(results.DeletedObjects), 0, "No Updates")
}

func TestUpdateNewPropRootObj(t *testing.T) {
	var newDoc map[string]any

	var oldDoc map[string]any
	json.Unmarshal([]byte(example), &newDoc)
	json.Unmarshal([]byte(example), &oldDoc)

	newDoc["newProp"] = "new!"

	results := DiffDocs(newDoc, oldDoc, []string{})

	assert.Equal(t, len(results.UpdatedObjects), 1, "One Update")
	assert.Equal(t, len(results.NewObjects), 0, "No Updates")
	assert.Equal(t, len(results.DeletedObjects), 0, "No Updates")
}

func TestUpdateRemovePropRootObj(t *testing.T) {
	var newDoc map[string]any

	var oldDoc map[string]any
	json.Unmarshal([]byte(example), &newDoc)
	json.Unmarshal([]byte(example), &oldDoc)

	delete(newDoc, "type")

	results := DiffDocs(newDoc, oldDoc, []string{})

	assert.Equal(t, len(results.UpdatedObjects), 1, "One Update")
	assert.Equal(t, len(results.NewObjects), 0, "No Updates")
	assert.Equal(t, len(results.DeletedObjects), 0, "No Updates")
}

func TestUpdateSubObj(t *testing.T) {
	var newDoc map[string]any

	var oldDoc map[string]any
	json.Unmarshal([]byte(example), &newDoc)
	json.Unmarshal([]byte(example), &oldDoc)

	newDoc["person"].(JsonDoc)["name"] = "dave"

	results := DiffDocs(newDoc, oldDoc, []string{})

	assert.Equal(t, len(results.UpdatedObjects), 1, "One Update")
	assert.Equal(t, len(results.NewObjects), 0, "No Updates")
	assert.Equal(t, len(results.DeletedObjects), 0, "No Updates")
}

func TestUpdateSubArrayObj(t *testing.T) {
	var newDoc map[string]any

	var oldDoc map[string]any
	json.Unmarshal([]byte(example), &newDoc)
	json.Unmarshal([]byte(example), &oldDoc)

	newDoc["order"].([]interface{})[0].(JsonDoc)["orderDate"] = "2004-10-01T15:00:00Z"

	results := DiffDocs(newDoc, oldDoc, []string{})

	assert.Equal(t, len(results.UpdatedObjects), 1, "One Update")
	assert.Equal(t, len(results.NewObjects), 0, "No Updates")
	assert.Equal(t, len(results.DeletedObjects), 0, "No Updates")
}

func TestAddSubElementObj(t *testing.T) {
	var newDoc map[string]any
	var newElement map[string]any
	var oldDoc map[string]any
	json.Unmarshal([]byte(example), &newDoc)
	json.Unmarshal([]byte(example), &oldDoc)

	err := json.Unmarshal([]byte(exampleNewSubElement), &newElement)

	if err != nil {
		assert.Error(t, err, "Failed to unmarshall test data")
	}

	newDoc["newProp"] = newElement

	newDocWithTmps, _ := AddTmpIdToJSON(newDoc)

	results := DiffDocs(newDocWithTmps, oldDoc, []string{})

	assert.Equal(t, len(results.UpdatedObjects), 0, "No Update")
	assert.Equal(t, len(results.NewObjects), 1, "Oen Add")
	assert.Equal(t, len(results.DeletedObjects), 0, "No Updates")
}

func TestDeleteSubElementObj(t *testing.T) {
	var newDoc map[string]any

	var oldDoc map[string]any
	json.Unmarshal([]byte(example), &newDoc)
	json.Unmarshal([]byte(example), &oldDoc)

	delete(newDoc, "person")

	results := DiffDocs(newDoc, oldDoc, []string{})

	assert.Equal(t, len(results.UpdatedObjects), 0, "No Update")
	assert.Equal(t, len(results.NewObjects), 0, "No Updates")
	assert.Equal(t, len(results.DeletedObjects), 1, "One Delete")
}

func TestAddArrayElementObj(t *testing.T) {
	var newDoc map[string]any
	var newElement map[string]any
	var oldDoc map[string]any
	json.Unmarshal([]byte(example), &newDoc)
	json.Unmarshal([]byte(example), &oldDoc)

	err := json.Unmarshal([]byte(exampleNewSubElement), &newElement)

	if err != nil {
		assert.Error(t, err, "Failed to unmarshall test data")
	}

	orders := newDoc["order"].([]interface{})

	newDoc["order"] = append(orders, newElement)
	newDocWithTmps, _ := AddTmpIdToJSON(newDoc)

	results := DiffDocs(newDocWithTmps, oldDoc, []string{})

	assert.Equal(t, len(results.UpdatedObjects), 0, "No Update")
	assert.Equal(t, len(results.NewObjects), 1, "Oen Add")
	assert.Equal(t, len(results.DeletedObjects), 0, "No Updates")
}

func TestDeleteArrayElementObj(t *testing.T) {
	var newDoc map[string]any

	var oldDoc map[string]any
	json.Unmarshal([]byte(example), &newDoc)
	json.Unmarshal([]byte(example), &oldDoc)

	orders := newDoc["order"].([]interface{})

	newDoc["order"] = orders[:len(orders)-1]

	results := DiffDocs(newDoc, oldDoc, []string{})

	assert.Equal(t, len(results.UpdatedObjects), 0, "No Update")
	assert.Equal(t, len(results.NewObjects), 0, "No Updates")
	assert.Equal(t, len(results.DeletedObjects), 1, "One Delete")
}
