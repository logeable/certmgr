package mcptools

import (
	"context"
	"encoding/json"

	"github.com/logeable/certmgr/internal/service"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

func InitCertificateTools(certificateService *service.CertificateService) []server.ServerTool {
	return []server.ServerTool{
		{
			Tool: mcp.NewTool("list_certificates", mcp.WithDescription("列出指定空间下的所有证书"),
				mcp.WithNumber("namespace_id",
					mcp.Required(),
					mcp.Description("空间ID")),
			),
			Handler: listCertificatesHandler(certificateService),
		},
		{
			Tool: mcp.NewTool("get_certificate", mcp.WithDescription("获取指定证书详情"),
				mcp.WithNumber("id",
					mcp.Required(),
					mcp.Description("证书ID")),
			),
			Handler: getCertificateHandler(certificateService),
		},
		{
			Tool: mcp.NewTool("create_certificate", mcp.WithDescription("创建证书"),
				mcp.WithNumber("namespace_id",
					mcp.Required(),
					mcp.Description("空间ID")),
				mcp.WithNumber("issuer_id",
					mcp.Required(),
					mcp.Description("签发者ID, 0 表示根证书，同一个空间下只能有一个根证书")),
				mcp.WithString("key_type",
					mcp.Required(),
					mcp.Description("密钥类型, 支持 RSA, ECDSA, ED25519")),
				mcp.WithNumber("key_len",
					mcp.Description("密钥长度, 支持 2048, 3072, 4096, 只有 key_type 是 RSA 时需要指定")),
				mcp.WithString("ecc_curve",
					mcp.Description("椭圆曲线, 支持 P224, P256, P384, P521, 只有 key_type 是 ECDSA 时需要指定")),
				mcp.WithNumber("valid_days",
					mcp.Required(),
					mcp.Description("证书有效期, 单位: 天")),
				mcp.WithString("desc",
					mcp.Description("证书描述")),
				mcp.WithString("usage",
					mcp.Required(),
					mcp.Description("证书用途, 支持 CA,server, client, code")),
				mcp.WithObject("subject",
					mcp.Required(),
					mcp.Description("证书主题"),
					mcp.Properties(map[string]any{
						"country": map[string]any{
							"type":        "string",
							"description": "国家, 2 个字母的 ISO 3166 国家代码，如 CN, US",
						},
						"state": map[string]any{
							"type":        "string",
							"description": "州或者省份, 如 California",
						},
						"city": map[string]any{
							"type":        "string",
							"description": "城市, 如 San Francisco",
						},
						"org": map[string]any{
							"type":        "string",
							"description": "组织, 如 Google, Inc.",
						},
						"ou": map[string]any{
							"type":        "string",
							"description": "组织单位, 如 R&D",
						},
						"common_name": map[string]any{
							"type":        "string",
							"description": "通用名称, 如 www.google.com",
						},
					}),
				),
				mcp.WithArray("dns_names",
					mcp.Description("DNS 名称, 如 www.google.com, 可以指定多个"),
				),
				mcp.WithArray("ip_addresses",
					mcp.Description("IP 地址, 如 192.168.1.1, 可以指定多个"),
				),
			),
			Handler: createCertificateHandler(certificateService),
		},
		{
			Tool: mcp.NewTool("delete_certificate", mcp.WithDescription("删除证书"),
				mcp.WithNumber("id",
					mcp.Required(),
					mcp.Description("证书ID")),
			),
			Handler: deleteCertificateHandler(certificateService),
		},
		{
			Tool: mcp.NewTool("renew_certificate", mcp.WithDescription("续期证书"),
				mcp.WithNumber("id",
					mcp.Required(),
					mcp.Description("证书ID")),
				mcp.WithNumber("valid_days",
					mcp.Required(),
					mcp.Description("续期天数")),
			),
			Handler: renewCertificateHandler(certificateService),
		},
	}
}

func listCertificatesHandler(certificateService *service.CertificateService) server.ToolHandlerFunc {
	type CertificateResponse struct {
		ID        int    `json:"id"`
		Desc      string `json:"desc"`
		UpdatedAt int64  `json:"updatedAt"`
		CreatedAt int64  `json:"createdAt"`
		Subject   string `json:"subject"`
		IssuerID  int    `json:"issuerId"`
		IsCA      bool   `json:"isCA"`
		Usage     string `json:"usage"`
	}

	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		namespaceId, err := req.RequireInt("namespace_id")
		if err != nil {
			return mcp.NewToolResultErrorFromErr("invalid namespace_id", err), nil
		}
		certificates, err := certificateService.ListCertificates(ctx, namespaceId)
		if err != nil {
			return mcp.NewToolResultErrorFromErr("failed to list certificates", err), nil
		}
		var result []CertificateResponse
		for _, cert := range certificates {
			result = append(result, CertificateResponse{
				ID:        cert.ID,
				Desc:      cert.Desc,
				UpdatedAt: cert.UpdatedAt.Unix(),
				CreatedAt: cert.CreatedAt.Unix(),
				Subject:   cert.Subject,
				IssuerID:  cert.IssuerID,
				IsCA:      cert.IsCA,
				Usage:     cert.Usage,
			})
		}
		jsonBytes, err := json.Marshal(result)
		if err != nil {
			return mcp.NewToolResultErrorFromErr("failed to marshal certificates", err), nil
		}
		return mcp.NewToolResultText(string(jsonBytes)), nil
	}
}

func getCertificateHandler(certificateService *service.CertificateService) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		id, err := req.RequireInt("id")
		if err != nil {
			return mcp.NewToolResultErrorFromErr("invalid id", err), nil
		}
		cert, err := certificateService.GetCertificate(ctx, id)
		if err != nil {
			return mcp.NewToolResultErrorFromErr("failed to get certificate", err), nil
		}
		jsonBytes, err := json.Marshal(cert)
		if err != nil {
			return mcp.NewToolResultErrorFromErr("failed to marshal certificate", err), nil
		}
		return mcp.NewToolResultText(string(jsonBytes)), nil
	}
}

func createCertificateHandler(certificateService *service.CertificateService) server.ToolHandlerFunc {
	type Subject struct {
		Country    string `json:"country"`
		State      string `json:"state"`
		City       string `json:"city"`
		Org        string `json:"org"`
		Ou         string `json:"ou"`
		CommonName string `json:"common_name"`
	}

	type Req struct {
		NamespaceId int      `json:"namespace_id"`
		IssuerId    int      `json:"issuer_id"`
		KeyType     string   `json:"key_type"`
		KeyLen      int      `json:"key_len"`
		ECCCurve    string   `json:"ecc_curve"`
		ValidDays   int      `json:"valid_days"`
		Desc        string   `json:"desc"`
		Subject     Subject  `json:"subject"`
		Usage       string   `json:"usage"`
		DNSNames    []string `json:"dns_names"`
		IPAddresses []string `json:"ip_addresses"`
	}

	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		var args Req
		if err := req.BindArguments(&args); err != nil {
			return mcp.NewToolResultErrorFromErr("failed to bind arguments", err), nil
		}
		svcReq := service.CreateCertReq{
			NamespaceId: args.NamespaceId,
			IssuerId:    args.IssuerId,
			KeyType:     args.KeyType,
			KeyLen:      args.KeyLen,
			ECCCurve:    args.ECCCurve,
			ValidDays:   args.ValidDays,
			Desc:        args.Desc,
			Subject: service.Subject{
				Country:    args.Subject.Country,
				State:      args.Subject.State,
				City:       args.Subject.City,
				Org:        args.Subject.Org,
				Ou:         args.Subject.Ou,
				CommonName: args.Subject.CommonName,
			},
			Usage:       args.Usage,
			DNSNames:    args.DNSNames,
			IPAddresses: args.IPAddresses,
		}
		completeByUsage(args.Usage, &svcReq)
		cert, err := certificateService.CreateCertificate(ctx, svcReq)
		if err != nil {
			return mcp.NewToolResultErrorFromErr("failed to create certificate", err), nil
		}
		jsonBytes, err := json.Marshal(cert)
		if err != nil {
			return mcp.NewToolResultErrorFromErr("failed to marshal certificate", err), nil
		}
		return mcp.NewToolResultText(string(jsonBytes)), nil
	}
}

func deleteCertificateHandler(certificateService *service.CertificateService) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		id, err := req.RequireInt("id")
		if err != nil {
			return mcp.NewToolResultErrorFromErr("invalid id", err), nil
		}
		err = certificateService.DeleteCertificate(ctx, id)
		if err != nil {
			return mcp.NewToolResultErrorFromErr("failed to delete certificate", err), nil
		}
		return mcp.NewToolResultText("certificate deleted successfully"), nil
	}
}

func renewCertificateHandler(certificateService *service.CertificateService) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		id, err := req.RequireInt("id")
		if err != nil {
			return mcp.NewToolResultErrorFromErr("invalid id", err), nil
		}
		validDays, err := req.RequireInt("valid_days")
		if err != nil {
			return mcp.NewToolResultErrorFromErr("invalid valid_days", err), nil
		}
		err = certificateService.RenewCertificate(ctx, id, validDays)
		if err != nil {
			return mcp.NewToolResultErrorFromErr("failed to renew certificate", err), nil
		}
		return mcp.NewToolResultText("certificate renewed successfully"), nil
	}
}

func completeByUsage(usage string, req *service.CreateCertReq) {
	switch usage {
	case "CA":
		req.KeyUsage.KeyCertSign = true
		req.KeyUsage.CRLSign = true
		req.BasicConstraints.CA = true
	case "server":
		req.KeyUsage.DigitalSignature = true
		req.KeyUsage.KeyEncipherment = true
	case "client":
		req.KeyUsage.DigitalSignature = true
		req.ExtendedKeyUsage.ClientAuth = true
	case "code":
		req.KeyUsage.DigitalSignature = true
		req.ExtendedKeyUsage.CodeSigning = true
	}
}
