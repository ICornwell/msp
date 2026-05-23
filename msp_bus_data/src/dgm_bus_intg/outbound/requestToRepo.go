package outbound

import (
	"bytes"
	"dgm_bus_intg/config"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
)

type OutBoundRequestType string

const (
	OutBoundRequestType_Query       OutBoundRequestType = "graph/query"
	OutBoundRequestType_Update      OutBoundRequestType = "graph/update"
	OutBoundRequestType_Transaction OutBoundRequestType = "graph/transaction"
)

func OutBoundRequest(requestType OutBoundRequestType, requestBody any) ([]byte, error) {
	return OutBoundRequestWithOptions(http.MethodPut, requestType, requestBody, nil)
}

func OutBoundRequestWithOptions(
	method string,
	requestType OutBoundRequestType,
	requestBody any,
	queryParams map[string]string,
) ([]byte, error) {
	var requestReader io.Reader

	if requestBody != nil {
		jsonBytes, err1 := json.Marshal(requestBody)
		if err1 != nil {
			return nil, err1
		}
		requestReader = bytes.NewBuffer(jsonBytes)
	}

	fullURL := config.GetRepoUrl() + string(requestType)
	parsedURL, err2 := url.Parse(fullURL)
	if err2 != nil {
		return nil, err2
	}

	if len(queryParams) > 0 {
		q := parsedURL.Query()
		for k, v := range queryParams {
			q.Set(k, v)
		}
		parsedURL.RawQuery = q.Encode()
	}

	req, err3 := http.NewRequest(method, parsedURL.String(), requestReader)
	if err3 != nil {
		return nil, err3
	}

	if requestBody != nil {
		req.Header.Set("content-type", "application/json")
	}

	client := &http.Client{}

	response, err4 := client.Do(req)
	if err4 != nil {
		return nil, err4
	}
	defer response.Body.Close()

	body, err5 := io.ReadAll(response.Body)
	if err5 != nil {
		return nil, err5
	}

	return body, nil
}
