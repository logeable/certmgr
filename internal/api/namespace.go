package api

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/logeable/certmgr/ent"
	"github.com/logeable/certmgr/ent/certificate"
	"github.com/logeable/certmgr/internal/service"
)

type NamespaceRequest struct {
	Name string `json:"name"`
	Desc string `json:"desc"`
}

type NamespaceResponse struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Desc      string `json:"desc"`
	CreatedAt int64  `json:"createdAt"`
	CertCount int    `json:"certCount"`
}

func RegisterNamespaceRoutes(g *echo.Group, client *ent.Client) {
	g.GET("/", func(c echo.Context) error {
		namespaces, err := service.ListNamespaces(c.Request().Context(), client)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		resp := make([]NamespaceResponse, 0, len(namespaces))
		for _, namespace := range namespaces {
			certCount, err := client.Certificate.Query().Where(certificate.NamespaceIDEQ(namespace.ID)).Count(c.Request().Context())
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
			}
			resp = append(resp, NamespaceResponse{
				ID:        namespace.ID,
				Name:      namespace.Name,
				Desc:      namespace.Desc,
				CreatedAt: namespace.CreatedAt.Unix(),
				CertCount: certCount,
			})
		}
		return c.JSON(http.StatusOK, resp)
	})

	g.POST("/", func(c echo.Context) error {
		var req NamespaceRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		namespace, err := service.CreateNamespace(c.Request().Context(), client, service.NamespaceInput{
			Name: req.Name,
			Desc: req.Desc,
		})
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, map[string]string{"id": strconv.Itoa(namespace.ID)})
	})

	g.GET("/:id", func(c echo.Context) error {
		id := c.Param("id")
		idInt, err := strconv.Atoi(id)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		namespace, err := service.GetNamespace(c.Request().Context(), client, idInt)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, namespace)
	})

	g.PUT("/:id", func(c echo.Context) error {
		id := c.Param("id")
		idInt, err := strconv.Atoi(id)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		var req NamespaceRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		updated, err := service.UpdateNamespace(c.Request().Context(), client, idInt, service.NamespaceInput{
			Name: req.Name,
			Desc: req.Desc,
		})
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, updated)
	})

	g.DELETE("/:id", func(c echo.Context) error {
		id := c.Param("id")
		idInt, err := strconv.Atoi(id)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		err = service.DeleteNamespace(c.Request().Context(), client, idInt)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, nil)
	})
}
