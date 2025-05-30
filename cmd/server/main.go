package main

import (
	"context"
	"flag"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/logeable/certmgr/ent"
	"github.com/logeable/certmgr/internal/api"
	_ "github.com/mattn/go-sqlite3"
	"go.uber.org/zap"
)

var port = flag.Int("port", 0, "port to listen on")

func main() {
	flag.Parse()

	logger, err := zap.NewDevelopment()
	if err != nil {
		panic(err)
	}
	defer func() {
		err := logger.Sync()
		if err != nil {
			panic(err)
		}
	}()
	zap.ReplaceGlobals(logger)

	dbPath := filepath.Join(os.Getenv("HOME"), ".certmgr", "certmgr.db")
	err = os.MkdirAll(filepath.Dir(dbPath), 0755)
	if err != nil {
		zap.L().Fatal("failed to create db dir", zap.Error(err))
	}

	client, err := ent.Open("sqlite3", "file:"+dbPath+"?cache=shared&_fk=1")
	if err != nil {
		zap.L().Fatal("failed to open db", zap.Error(err))
	}
	defer client.Close()

	if err := client.Schema.Create(context.Background()); err != nil {
		zap.L().Fatal("failed to create schema", zap.Error(err))
	}
	zap.L().Info("Database created")

	e := echo.New()

	apiGroup := e.Group("/api/v1")
	api.RegisterNamespaceRoutes(apiGroup.Group("/namespaces"), client)
	api.RegisterCertificateRoutes(apiGroup.Group("/certificates"), client)

	e.GET("/status", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	for _, route := range e.Routes() {
		zap.L().Info("route", zap.String("method", route.Method), zap.String("path", route.Path))
	}

	err = e.Start("127.0.0.1:" + strconv.Itoa(*port))
	if err != nil {
		zap.L().Fatal("server start failed", zap.Error(err))
	}
}
