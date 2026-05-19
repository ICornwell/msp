package outbound

import (
	"bytes"
	"dgm_bus_intg/config"
	"encoding/json"
	"io"
	"net/http"
)

type OutBoundRequestType string

const (
	OutBoundRequestType_Query  = "graph/query"
	OutBoundRequestType_Update = "graph/update"
)

func OutBoundRequest(requestType OutBoundRequestType, requestBody any) ([]byte, error) {

	jsonBytes, err1 := json.Marshal(requestBody)
	if err1 != nil {
		return nil, err1
	}

	fullUrl := config.GetRepoUrl() + string(requestType)

	req, err2 := http.NewRequest(http.MethodPut, fullUrl, bytes.NewBuffer(jsonBytes))
	req.Header.Set("content-type", "application/json")
	if err2 != nil {
		return nil, err2
	}

	client := &http.Client{}

	response, err3 := client.Do(req)
	if err3 != nil {
		return nil, err3
	}

	body, err4 := io.ReadAll(response.Body)
	if err4 != nil {
		return nil, err4
	}

	return body, nil

}
