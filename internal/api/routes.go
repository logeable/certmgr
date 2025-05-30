package api

import (
	"github.com/labstack/echo/v4"
	"github.com/logeable/certmgr/internal/ent"
	"github.com/logeable/certmgr/internal/service"
)

func RegisterRoutes(e *echo.Echo, client *ent.Client) {
	ctx := service.NewServiceContext(client)

	apiGroup := e.Group("/api/v1")
	RegisterNamespaceRoutes(apiGroup.Group("/namespaces"), ctx)
	RegisterCertificateRoutes(apiGroup.Group("/certificates"), ctx)
}
