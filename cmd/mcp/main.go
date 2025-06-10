package main

import (
	"fmt"

	"github.com/logeable/certmgr/internal/infra"
	"github.com/logeable/certmgr/internal/mcptools"
	"github.com/mark3labs/mcp-go/server"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	dbClient, err := infra.InitDB()
	if err != nil {
		panic(err)
	}
	defer func() {
		err := dbClient.Close()
		if err != nil {
			panic(err)
		}
	}()

	s := server.NewMCPServer("certmgr", "v0.1.0", server.WithToolCapabilities(false))

	tools, err := mcptools.InitTools(dbClient)
	if err != nil {
		panic(err)
	}
	s.AddTools(tools...)

	if err := server.ServeStdio(s); err != nil {
		panic(fmt.Errorf("failed to serve: %v", err))
	}
}
