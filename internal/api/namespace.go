package api

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/logeable/certmgr/internal/ent"
	"github.com/logeable/certmgr/internal/service"
	"go.uber.org/zap"
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

func RegisterNamespaceRoutes(g *echo.Group, ctx *service.ServiceContext) {
	g.GET("/", ListNamespacesHandler(ctx))
	g.POST("/", CreateNamespaceHandler(ctx))
	g.GET("/:id", GetNamespaceHandler(ctx))
	g.PUT("/:id", UpdateNamespaceHandler(ctx))
	g.DELETE("/:id", DeleteNamespaceHandler(ctx))
}

func ListNamespacesHandler(ctx *service.ServiceContext) echo.HandlerFunc {
	type Response struct {
		ID        int    `json:"id"`
		Name      string `json:"name"`
		Desc      string `json:"desc"`
		UpdatedAt int64  `json:"updatedAt"`
		CreatedAt int64  `json:"createdAt"`
		CertCount int    `json:"certCount"`
	}

	return func(c echo.Context) error {
		logger := zap.L().With(zap.String("handler", "ListNamespacesHandler"))

		svc := service.NewNamespaceService(ctx)
		namespaces, err := svc.ListNamespaces(c.Request().Context())
		if err != nil {
			logger.Error("list failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		}

		resp := make([]Response, 0, len(namespaces))
		for _, namespace := range namespaces {
			resp = append(resp, Response{
				ID:        namespace.ID,
				Name:      namespace.Name,
				Desc:      namespace.Desc,
				UpdatedAt: namespace.UpdatedAt.Unix(),
				CreatedAt: namespace.CreatedAt.Unix(),
				CertCount: namespace.CertCount,
			})
		}

		return c.JSON(http.StatusOK, resp)
	}
}

func CreateNamespaceHandler(ctx *service.ServiceContext) echo.HandlerFunc {
	return func(c echo.Context) error {
		logger := zap.L().With(zap.String("handler", "CreateNamespaceHandler"))

		var req NamespaceRequest
		if err := c.Bind(&req); err != nil {
			logger.Error("bind failed", zap.Error(err))
			return c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		}

		svc := service.NewNamespaceService(ctx)
		namespace, err := svc.CreateNamespace(c.Request().Context(), ent.Namespace{
			Name: req.Name,
			Desc: req.Desc,
		})
		if err != nil {
			logger.Error("create failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		}

		return c.JSON(http.StatusCreated, map[string]string{"id": strconv.Itoa(namespace.ID)})
	}
}

func GetNamespaceHandler(ctx *service.ServiceContext) echo.HandlerFunc {
	return func(c echo.Context) error {
		logger := zap.L().With(zap.String("handler", "GetNamespaceHandler"))

		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Error("convert param failed", zap.String("id", c.Param("id")), zap.Error(err))
			return c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		}

		logger = logger.With(zap.Int("id", id))
		svc := service.NewNamespaceService(ctx)
		namespace, err := svc.GetNamespace(c.Request().Context(), id)
		if err != nil {
			logger.Error("get failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		}
		return c.JSON(http.StatusOK, namespace)
	}
}

func UpdateNamespaceHandler(ctx *service.ServiceContext) echo.HandlerFunc {
	return func(c echo.Context) error {
		logger := zap.L().With(zap.String("handler", "UpdateNamespaceHandler"))

		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Error("convert param failed", zap.String("id", c.Param("id")), zap.Error(err))
			return c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		}

		logger = logger.With(zap.Int("id", id))
		var req NamespaceRequest
		if err := c.Bind(&req); err != nil {
			logger.Error("bind failed", zap.Error(err))
			return c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		}

		svc := service.NewNamespaceService(ctx)
		updated, err := svc.UpdateNamespace(c.Request().Context(), id, ent.Namespace{
			Name: req.Name,
			Desc: req.Desc,
		})
		if err != nil {
			logger.Error("update failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		}
		return c.JSON(http.StatusOK, updated)
	}
}

func DeleteNamespaceHandler(ctx *service.ServiceContext) echo.HandlerFunc {
	return func(c echo.Context) error {
		logger := zap.L().With(zap.String("handler", "DeleteNamespaceHandler"))

		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Error("convert param failed", zap.String("id", c.Param("id")), zap.Error(err))
			return c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		}

		logger = logger.With(zap.Int("id", id))
		svc := service.NewNamespaceService(ctx)
		err = svc.DeleteNamespace(c.Request().Context(), id)
		if err != nil {
			logger.Error("delete failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		}
		return c.JSON(http.StatusNoContent, nil)
	}
}
