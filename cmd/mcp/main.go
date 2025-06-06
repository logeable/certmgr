package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

func main() {
	s := server.NewMCPServer("certmgr", "v0.1.0", server.WithToolCapabilities(false))

	listNamespaceTool := mcp.NewTool("list-namespace", mcp.WithDescription("list the namespace"))
	getCertsTool := mcp.NewTool("get-certs", mcp.WithDescription("get the certs"),
		mcp.WithNumber("namespace_id", mcp.Required(), mcp.Description("the namespace id")))

	s.AddTool(listNamespaceTool, listNamespaceToolHandler)
	s.AddTool(getCertsTool, getCertsToolHandler)

	if err := server.ServeStdio(s); err != nil {
		panic(fmt.Errorf("failed to serve: %v", err))
	}
}

func listNamespaceToolHandler(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	type Namespace struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
	namespaces := []Namespace{
		{ID: "1", Name: "default"},
		{ID: "2", Name: "test"},
	}
	json, err := json.Marshal(namespaces)
	if err != nil {
		return mcp.NewToolResultErrorFromErr("failed to marshal namespaces", err), nil
	}
	return mcp.NewToolResultText(string(json)), nil
}

func getCertsToolHandler(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	namespaceID, err := req.RequireInt("namespace_id")
	if err != nil {
		return mcp.NewToolResultErrorFromErr("namespace_id is required", err), nil
	}

	_ = namespaceID

	type Cert struct {
		ID      string `json:"id"`
		Subject string `json:"subject"`
		CertPEM string `json:"cert_pem"`
		KeyPEM  string `json:"key_pem"`
	}
	certs := []Cert{
		{
			ID:      "1",
			Subject: "test.com",
			CertPEM: "cert1",
			KeyPEM:  "key1",
		},
		{
			ID:      "2",
			Subject: "test2.com",
			CertPEM: "cert2",
			KeyPEM:  "key2",
		},
	}
	json, err := json.Marshal(certs)
	if err != nil {
		return mcp.NewToolResultErrorFromErr("failed to marshal cert", err), nil
	}
	return mcp.NewToolResultText(string(json)), nil
}
