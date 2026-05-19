package routes

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"dgm_bus_intg/access"
	"dgm_bus_intg/apiMessages"
	"dgm_bus_intg/utils"

	"github.com/gin-gonic/gin"
)

func addDocGraphRoutes(rg *gin.RouterGroup) {
	doc := rg.Group("/doc")

	doc.PUT("/test", func(c *gin.Context) {
		jsonData, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err.Error()))
			return
		}

		obj := map[string]interface{}{}
		err2 := json.Unmarshal(jsonData, &obj)
		if err2 != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err2.Error()))
			return
		}

		c.JSON(http.StatusOK, obj)
	})

	doc.PUT("/query/:key", func(c *gin.Context) {
		jsonData, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err.Error()))
			return
		}

		obj := apiMessages.ViewQuery{}
		err2 := json.Unmarshal(jsonData, &obj)
		if err2 != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err2.Error()))
			return
		}

		result, _, error := access.RunQuery(obj, c.Param("key"), true)
		if error != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", error.Error()))
			return
		}

		c.JSON(http.StatusOK, result)
	})

	doc.PUT("/upsert/:key", func(c *gin.Context) {
		callType := c.DefaultQuery("type", "exec")
		transactionId := c.DefaultQuery("tid", utils.GenerateId())
		jsonData, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err.Error()))
			return
		}

		obj := apiMessages.UpsertQuery{}
		err2 := json.Unmarshal(jsonData, &obj)
		if err2 != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", err2.Error()))
			return
		}

		response, error := access.RunUpsert(obj, c.Param("key"), callType, transactionId)
		if error != nil {
			c.JSON(http.StatusBadRequest, fmt.Sprintf("failed with error: %s", error.Error()))
			return
		}

		c.JSON(http.StatusOK, response)
	})
}
