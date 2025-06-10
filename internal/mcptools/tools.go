package mcptools

import (
	"github.com/logeable/certmgr/internal/ent"
	"github.com/logeable/certmgr/internal/service"
	"github.com/mark3labs/mcp-go/server"
)

func InitTools(dbClient *ent.Client) ([]server.ServerTool, error) {
	svcCtx := service.NewServiceContext(dbClient)
	namespaceService := service.NewNamespaceService(svcCtx)

	var tools []server.ServerTool

	tools = append(tools, InitNamespaceTools(namespaceService)...)

	return tools, nil
}
