package viewbuilder

import (
	"fmt"
)

func BuildDemoView() (string, error) {
	// Create a new query builder
	builder := New()

	// Build the query structure using fluent interface
	query, err := builder.
		DefineView().
			WithName("account-people", "1.0").
			WithRootKey("__businessKey").
			WithRootElement("account").
				AddSubElement("person").
					WithRelationFromParent("belongsTo").
				EndElement().
				AddSubElementsCollection("order").
					WithRelationFromParent("hasOrder").
					AddSubElementsCollection("orderItem").
						WithRelationFromParent("hasItem").
						AddSubElement("product").
							WithRelationFromParent("forProduct").
				EndAllElements().
			EndView().
		JSON()

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return "", err
	}

	fmt.Println(query)
	return query, nil
}
