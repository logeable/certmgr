package main

import (
	"flag"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/logeable/certmgr/internal/api"
	"github.com/logeable/certmgr/internal/infra"
	_ "github.com/mattn/go-sqlite3"
	"go.uber.org/zap"
)

var port = flag.Int("port", 0, "port to listen on")

func main() {
	flag.Parse()

	logger, err := infra.InitLogger()
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

	client, err := infra.InitDB()
	if err != nil {
		zap.L().Fatal("failed to init db", zap.Error(err))
	}
	defer client.Close()

	e := echo.New()
	api.RegisterRoutes(e, client)

	err = e.Start("127.0.0.1:" + strconv.Itoa(*port))
	if err != nil {
		zap.L().Fatal("server start failed", zap.Error(err))
	}
}
