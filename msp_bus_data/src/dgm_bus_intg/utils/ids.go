package utils

import "github.com/google/uuid"

func GenerateId() string {
	id, err := uuid.NewV7()
	if err != nil {
		// why can't we get a uuid?
		panic(err)
	}
	return id.String()
}