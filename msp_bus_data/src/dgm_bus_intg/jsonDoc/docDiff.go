package jsonDoc

func DiffDocs(doc1 JsonDoc, doc2 JsonDoc, entitiesList []string) DiffResult {
	return recursiveDiffDocs(doc1, doc2, NewDiffResult(), entitiesList)
}

func recursiveDiffDocs(newDoc JsonDoc, oldDoc JsonDoc, results DiffResult, entitiesList []string) DiffResult {
	newResults := results
	// go through all the members of the new doc element
	processed := false
	for newK, newV := range newDoc {
		if newK != "__metadata" && newK != "__businessKey" {
			oldV, ok := oldDoc[newK] // get the matching member from the old doc, if there is one
			if ok {
				// member is in both old and new doc
				switch newV.(type) {
				case int, float32, float64, string, bool:
					if newV != oldV && !processed { // if the values don't match, the doc has been updated
						newResults = newResults.AddUpdatedObject(oldDoc, newDoc) // TODO: this will add duplicates!!
						processed = true                                         // breaks after first update thing is noticed
					}
				case []interface{}: // if it is an array, then we need to check for matching members
					nsa := Map(newV.([]interface{}), func(i interface{}) map[string]interface{} { return i.(map[string]interface{}) })
					osa := Map(oldV.([]interface{}), func(i interface{}) map[string]interface{} { return i.(map[string]interface{}) })
					for _, nam := range nsa {
						idVal := ""
						if nam["id"] != nil {
							idVal = nam["id"].(string)
						}
						oam, ok := JsonObjByValue(osa, "id", idVal)
						if ok {
							newResults = recursiveDiffDocs(nam, oam, newResults, entitiesList)
						} else {
							nr := newResults.AddNewObject(nam)
							newResults = recursiveDiffDocs(nam, nil, nr, entitiesList)
						}
					}
					for _, oam := range osa {
						idVal := ""
						if oam["id"] != nil {
							idVal = oam["id"].(string)
						}
						_, ok := JsonObjByValue(nsa, "id", idVal)
						if !ok {
							newResults = newResults.AddDeletedObject(oam)
						}
					}
				case map[string]interface{}: // if it is a matching object, then we need to recurse in to check the members
					newResults = recursiveDiffDocs(newV.(JsonDoc), oldV.(JsonDoc), newResults, entitiesList)
				}
			} else { // if it wasn't matched in the old doc, then it is new!
				switch newV.(type) {
				case int, float32, float64, string, bool:
					if oldDoc != nil && !processed { // if its null we're rinning through a stack of new objs
						newResults = newResults.AddUpdatedObject(oldDoc, newDoc) // doc has new simple members so has been updated
						processed = true
					} else if !processed {
						newResults = newResults.AddNewObject(newDoc) // doc has new sub element, so a new object
						processed = true
					}
				case []interface{}:
					nsa := Map(newV.([]interface{}), func(i interface{}) map[string]interface{} { return i.(map[string]interface{}) })
					for _, nam := range nsa {
						nr := newResults.AddNewObject(nam) // doc has new sub element, so a new object
						newResults = recursiveDiffDocs(nam, nil, nr, entitiesList)
					}
				default:
					nr := newResults.AddNewObject(newV.(JsonDoc)) // doc has new sub element, so a new object
					newResults = recursiveDiffDocs(newV.(JsonDoc), nil, nr, entitiesList)
				}
			}
		}
	}
	for oldK, oldV := range oldDoc {
		_, ok := newDoc[oldK]
		if !ok {
			switch oldV.(type) {
			case int, float32, float64, string, bool:
				newResults = newResults.AddUpdatedObject(oldDoc, newDoc) // doc has missing simple members so has been updated
			default:
				if oldK != "__metedata" {
					newResults = newResults.AddDeletedObject(oldV.(JsonDoc))
				}
			}
		}
	}

	return newResults
}
