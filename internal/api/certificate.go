package api

import (
	"bytes"
	"fmt"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/logeable/certmgr/internal/service"
	"go.uber.org/zap"
)

func RegisterCertificateRoutes(g *echo.Group, ctx *service.ServiceContext) {
	g.GET("/", ListCertificatesHandler(ctx))
	g.GET("/:id", GetCertificateHandler(ctx))
	g.DELETE("/:id", DeleteCertificateHandler(ctx))
	g.POST("/", CreateCertificateHandler(ctx))
	g.POST("/:id/renew/", RenewCertificateHandler(ctx))
	g.POST("/:id/export/", ExportCertificateHandler(ctx))
}

func ListCertificatesHandler(ctx *service.ServiceContext) echo.HandlerFunc {
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

	return func(c echo.Context) error {
		logger := zap.L().With(zap.String("handler", "ListCertificatesHandler"))
		nsID, err := strconv.Atoi(c.QueryParam("namespaceId"))
		if err != nil {
			logger.Error("convert param failed", zap.String("namespaceId", c.QueryParam("namespaceId")), zap.Error(err))
			return c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid namespace_id"})
		}

		logger = logger.With(zap.Int("namespaceId", nsID))
		svc := service.NewCertificateService(ctx)
		certs, err := svc.ListCertificates(c.Request().Context(), nsID)
		if err != nil {
			logger.Error("list failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		}

		resp := make([]CertificateResponse, len(certs))
		for i, cert := range certs {
			resp[i] = CertificateResponse{
				ID:        cert.ID,
				Desc:      cert.Desc,
				UpdatedAt: cert.UpdatedAt.Unix(),
				CreatedAt: cert.CreatedAt.Unix(),
				Subject:   cert.Subject,
				IssuerID:  cert.IssuerID,
				IsCA:      cert.IsCA,
				Usage:     cert.Usage,
			}
		}

		return c.JSON(http.StatusOK, resp)
	}
}

func DeleteCertificateHandler(ctx *service.ServiceContext) echo.HandlerFunc {
	return func(c echo.Context) error {
		logger := zap.L().With(zap.String("handler", "DeleteCertificateHandler"))
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Error("convert param failed", zap.String("id", c.Param("id")), zap.Error(err))
			return c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		}

		logger = logger.With(zap.Int("id", id))
		svc := service.NewCertificateService(ctx)
		err = svc.DeleteCertificate(c.Request().Context(), id)
		if err != nil {
			logger.Error("delete failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		}

		return c.JSON(http.StatusNoContent, nil)
	}
}

func CreateCertificateHandler(ctx *service.ServiceContext) echo.HandlerFunc {
	type Subject struct {
		Country    string `json:"country"`
		State      string `json:"state"`
		City       string `json:"city"`
		Org        string `json:"org"`
		Ou         string `json:"ou"`
		CommonName string `json:"commonName"`
	}

	type KeyUsage struct {
		DigitalSignature bool `json:"digitalSignature"`
		KeyEncipherment  bool `json:"keyEncipherment"`
		KeyCertSign      bool `json:"keyCertSign"`
		CRLSign          bool `json:"cRLSign"`
	}

	type ExtendedKeyUsage struct {
		ServerAuth  bool `json:"serverAuth"`
		ClientAuth  bool `json:"clientAuth"`
		CodeSigning bool `json:"codeSigning"`
	}
	type BasicConstraints struct {
		CA bool `json:"ca"`
	}

	type Req struct {
		NamespaceId      int              `json:"namespaceId"`
		IssuerId         int              `json:"issuerId"`
		KeyType          string           `json:"keyType"`
		KeyLen           int              `json:"keyLen"`
		ECCCurve         string           `json:"eccCurve"`
		ValidDays        int              `json:"validDays"`
		Desc             string           `json:"desc"`
		Subject          Subject          `json:"subject"`
		Usage            string           `json:"usage"`
		KeyUsage         KeyUsage         `json:"keyUsage"`
		ExtendedKeyUsage ExtendedKeyUsage `json:"extendedKeyUsage"`
		BasicConstraints BasicConstraints `json:"basicConstraints"`
		DNSNames         []string         `json:"dnsNames"`
		IPAddresses      []string         `json:"ipAddresses"`
	}

	return func(c echo.Context) error {
		logger := zap.L().With(zap.String("handler", "CreateCertificateHandler"))
		var req Req
		if err := c.Bind(&req); err != nil {
			logger.Error("bind failed", zap.Error(err))
			return c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		}

		svc := service.NewCertificateService(ctx)
		createdCert, err := svc.CreateCertificate(
			c.Request().Context(), service.CreateCertReq{
				NamespaceId: req.NamespaceId,
				IssuerId:    req.IssuerId,
				KeyType:     req.KeyType,
				KeyLen:      req.KeyLen,
				ECCCurve:    req.ECCCurve,
				ValidDays:   req.ValidDays,
				Desc:        req.Desc,
				Subject: service.Subject{
					Country:    req.Subject.Country,
					State:      req.Subject.State,
					City:       req.Subject.City,
					Org:        req.Subject.Org,
					Ou:         req.Subject.Ou,
					CommonName: req.Subject.CommonName,
				},
				Usage: req.Usage,
				KeyUsage: service.KeyUsage{
					DigitalSignature: req.KeyUsage.DigitalSignature,
					KeyEncipherment:  req.KeyUsage.KeyEncipherment,
					KeyCertSign:      req.KeyUsage.KeyCertSign,
					CRLSign:          req.KeyUsage.CRLSign,
				},
				ExtendedKeyUsage: service.ExtendedKeyUsage{
					ServerAuth:  req.ExtendedKeyUsage.ServerAuth,
					ClientAuth:  req.ExtendedKeyUsage.ClientAuth,
					CodeSigning: req.ExtendedKeyUsage.CodeSigning,
				},
				BasicConstraints: service.BasicConstraints{
					CA: req.BasicConstraints.CA,
				},
				DNSNames:    req.DNSNames,
				IPAddresses: req.IPAddresses,
			},
		)

		if err != nil {
			logger.Error("create failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		}

		return c.JSON(http.StatusCreated, createdCert)
	}
}

func RenewCertificateHandler(ctx *service.ServiceContext) echo.HandlerFunc {
	type Req struct {
		ValidDays int `json:"validDays"`
	}

	return func(c echo.Context) error {
		logger := zap.L().With(zap.String("handler", "RenewCertificateHandler"))
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Error("convert param failed", zap.String("id", c.Param("id")), zap.Error(err))
			return c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		}

		logger = logger.With(zap.Int("id", id))
		var req Req
		if err := c.Bind(&req); err != nil {
			logger.Error("bind failed", zap.Error(err))
			return c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		}

		svc := service.NewCertificateService(ctx)
		err = svc.RenewCertificate(c.Request().Context(), id, req.ValidDays)
		if err != nil {
			logger.Error("renew failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		}

		return c.JSON(http.StatusOK, nil)
	}
}

func GetCertificateHandler(ctx *service.ServiceContext) echo.HandlerFunc {
	return func(c echo.Context) error {
		logger := zap.L().With(zap.String("handler", "GetCertificateHandler"))
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Error("convert param failed", zap.String("id", c.Param("id")), zap.Error(err))
			return c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		}

		logger = logger.With(zap.Int("id", id))
		svc := service.NewCertificateService(ctx)
		cert, err := svc.GetCertificate(c.Request().Context(), id)
		if err != nil {
			logger.Error("get failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		}

		return c.JSON(http.StatusOK, cert)
	}
}

func ExportCertificateHandler(ctx *service.ServiceContext) echo.HandlerFunc {
	return func(c echo.Context) error {
		logger := zap.L().With(zap.String("handler", "ExportCertificateHandler"))
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Error("convert param failed", zap.String("id", c.Param("id")), zap.Error(err))
			return c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		}

		logger = logger.With(zap.Int("id", id))
		svc := service.NewCertificateService(ctx)
		tar, err := svc.ExportCertificate(c.Request().Context(), id)
		if err != nil {
			logger.Error("export failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		}

		c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=certificate-%d.tar", id))
		return c.Stream(http.StatusOK, "application/x-tar", bytes.NewReader(tar))
	}
}
