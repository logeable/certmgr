package mcptools

import (
	"context"
	"encoding/json"
	"time"

	"github.com/logeable/certmgr/internal/ent"
	"github.com/logeable/certmgr/internal/service"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

type Namespace struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Desc      string    `json:"desc"`
	UpdatedAt time.Time `json:"updated_at"`
	CreatedAt time.Time `json:"created_at"`
	CertCount int       `json:"cert_count"`
}

func InitNamespaceTools(namespaceService *service.NamespaceService) []server.ServerTool {
	return []server.ServerTool{
		{
			Tool:    mcp.NewTool("list_spaces", mcp.WithDescription("列出所有空间")),
			Handler: listSpacesHandler(namespaceService),
		},
		{
			Tool: mcp.NewTool("create_space", mcp.WithDescription("创建新空间"),
				mcp.WithString("name",
					mcp.Required(),
					mcp.Description("空间名称")),
				mcp.WithString("desc",
					mcp.Description("空间描述")),
			),
			Handler: createSpaceHandler(namespaceService),
		},
		{
			Tool: mcp.NewTool("update_space", mcp.WithDescription("更新空间信息"),
				mcp.WithNumber("id",
					mcp.Required(),
					mcp.Description("空间ID")),
				mcp.WithString("name",
					mcp.Description("空间名称")),
				mcp.WithString("desc",
					mcp.Description("空间描述")),
			),
			Handler: updateSpaceHandler(namespaceService),
		},
		{
			Tool: mcp.NewTool("delete_space", mcp.WithDescription("删除空间"),
				mcp.WithNumber("id",
					mcp.Required(),
					mcp.Description("空间ID")),
			),
			Handler: deleteSpaceHandler(namespaceService),
		},
	}
}

func listSpacesHandler(namespaceService *service.NamespaceService) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		namespaces, err := namespaceService.ListNamespaces(ctx)
		if err != nil {
			return mcp.NewToolResultErrorFromErr("failed to list spaces", err), nil
		}
		var result []Namespace
		for _, ns := range namespaces {
			result = append(result, Namespace{
				ID:        ns.ID,
				Name:      ns.Name,
				Desc:      ns.Desc,
				UpdatedAt: ns.UpdatedAt,
				CreatedAt: ns.CreatedAt,
				CertCount: ns.CertCount,
			})
		}
		jsonBytes, err := json.Marshal(result)
		if err != nil {
			return mcp.NewToolResultErrorFromErr("failed to marshal spaces", err), nil
		}
		return mcp.NewToolResultText(string(jsonBytes)), nil
	}
}

func createSpaceHandler(namespaceService *service.NamespaceService) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		name, err := req.RequireString("name")
		if err != nil {
			return mcp.NewToolResultErrorFromErr("invalid name", err), nil
		}
		desc := req.GetString("desc", "")
		ns, err := namespaceService.CreateNamespace(ctx, ent.Namespace{
			Name: name,
			Desc: desc,
		})
		if err != nil {
			return mcp.NewToolResultErrorFromErr("failed to create space", err), nil
		}
		jsonBytes, err := json.Marshal(ns)
		if err != nil {
			return mcp.NewToolResultErrorFromErr("failed to marshal space", err), nil
		}
		return mcp.NewToolResultText(string(jsonBytes)), nil
	}
}

func updateSpaceHandler(namespaceService *service.NamespaceService) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		id, err := req.RequireInt("id")
		if err != nil {
			return mcp.NewToolResultErrorFromErr("invalid id", err), nil
		}
		ns, err := namespaceService.GetNamespace(ctx, id)
		if err != nil {
			return mcp.NewToolResultErrorFromErr("failed to get space", err), nil
		}
		name := req.GetString("name", ns.Name)
		desc := req.GetString("desc", ns.Desc)
		ns, err = namespaceService.UpdateNamespace(ctx, id, ent.Namespace{
			Name: name,
			Desc: desc,
		})
		if err != nil {
			return mcp.NewToolResultErrorFromErr("failed to update space", err), nil
		}
		jsonBytes, err := json.Marshal(ns)
		if err != nil {
			return mcp.NewToolResultErrorFromErr("failed to marshal space", err), nil
		}
		return mcp.NewToolResultText(string(jsonBytes)), nil
	}
}

func deleteSpaceHandler(namespaceService *service.NamespaceService) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		id, err := req.RequireInt("id")
		if err != nil {
			return mcp.NewToolResultErrorFromErr("invalid id", err), nil
		}
		if err := namespaceService.DeleteNamespace(ctx, id); err != nil {
			return mcp.NewToolResultErrorFromErr("failed to delete space", err), nil
		}
		return mcp.NewToolResultText("success"), nil
	}
}
