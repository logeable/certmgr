package api

import (
	"context"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"math/big"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/logeable/certmgr/ent"
	"github.com/logeable/certmgr/ent/certificate"
	"github.com/logeable/certmgr/internal/service"
	"github.com/logeable/certmgr/internal/util"
)

type Subject struct {
	Country    string `json:"country"`
	State      string `json:"state"`
	City       string `json:"city"`
	Org        string `json:"org"`
	Ou         string `json:"ou"`
	CommonName string `json:"commonName"`
}

type CertificateRequest struct {
	NamespaceId int     `json:"namespaceId"`
	IssuerId    int     `json:"issuerId"`
	KeyType     string  `json:"keyType"`
	KeyLen      int     `json:"keyLen"`
	ValidDays   int     `json:"validDays"`
	Desc        string  `json:"desc"`
	Subject     Subject `json:"subject"`
}

type CertificateResponse struct {
	ID        int    `json:"id"`
	Desc      string `json:"desc"`
	CertPem   string `json:"certPem"`
	KeyPem    string `json:"keyPem"`
	UpdatedAt int64  `json:"updatedAt"`
	CreatedAt int64  `json:"createdAt"`
	Subject   string `json:"subject"`
	IssuerID  int    `json:"issuerId"`
}

func RegisterCertificateRoutes(g *echo.Group, client *ent.Client) {
	g.GET("/", func(c echo.Context) error {
		nsID := c.QueryParam("namespaceId")
		nsIDInt, err := strconv.Atoi(nsID)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid namespace_id"})
		}
		certs, err := client.Certificate.Query().Where(certificate.NamespaceIDEQ(nsIDInt)).All(context.Background())
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		resp := make([]CertificateResponse, 0, len(certs))
		for _, cert := range certs {
			certPem, _ := pem.Decode([]byte(cert.CertPem))
			if certPem == nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{"error": "invalid certPem"})
			}
			x509Cert, err := x509.ParseCertificate(certPem.Bytes)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
			}
			resp = append(resp, CertificateResponse{
				ID:        cert.ID,
				Desc:      cert.Desc,
				CertPem:   cert.CertPem,
				KeyPem:    cert.KeyPem,
				UpdatedAt: cert.UpdatedAt.Unix(),
				CreatedAt: cert.CreatedAt.Unix(),
				Subject:   util.GetSubject(x509Cert),
				IssuerID:  cert.IssuerID,
			})
		}
		return c.JSON(http.StatusOK, resp)
	})

	g.POST("/", func(c echo.Context) error {
		var req CertificateRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		entCert, certPemBytes, _, err := service.CreateCertificate(
			c.Request().Context(), client, service.CreateCertInput{
				NamespaceId: req.NamespaceId,
				IssuerId:    req.IssuerId,
				KeyType:     req.KeyType,
				KeyLen:      req.KeyLen,
				Desc:        req.Desc,
				Subject: service.Subject{
					Country:    req.Subject.Country,
					State:      req.Subject.State,
					City:       req.Subject.City,
					Org:        req.Subject.Org,
					Ou:         req.Subject.Ou,
					CommonName: req.Subject.CommonName,
				},
			},
		)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		certPem, _ := pem.Decode(certPemBytes)
		if certPem == nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "invalid certPem"})
		}
		x509Cert, err := x509.ParseCertificate(certPem.Bytes)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, map[string]interface{}{
			"id":        entCert.ID,
			"desc":      entCert.Desc,
			"certPem":   entCert.CertPem,
			"keyPem":    entCert.KeyPem,
			"createdAt": entCert.CreatedAt.Unix(),
			"updatedAt": entCert.UpdatedAt.Unix(),
			"subject":   util.GetSubject(x509Cert),
		})
	})

	g.DELETE("/:id", func(c echo.Context) error {
		id := c.Param("id")
		idInt, err := strconv.Atoi(id)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		cert, err := client.Certificate.Get(context.Background(), idInt)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		subCerts, err := util.FindAllSubCertificates(client, cert)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		for _, subCert := range subCerts {
			err = client.Certificate.DeleteOneID(subCert.ID).Exec(context.Background())
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
			}
		}
		err = client.Certificate.DeleteOneID(idInt).Exec(context.Background())
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, map[string]string{"message": "Certificate deleted"})
	})

	g.POST("/:id/renew/", func(c echo.Context) error {
		id := c.Param("id")
		idInt, err := strconv.Atoi(id)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		type RenewReq struct {
			ValidDays int `json:"validDays"`
		}
		var req RenewReq
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		certData, err := client.Certificate.Get(context.Background(), idInt)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		keyPem, _ := pem.Decode([]byte(certData.KeyPem))
		key, err := x509.ParsePKCS1PrivateKey(keyPem.Bytes)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		certPem, _ := pem.Decode([]byte(certData.CertPem))
		cert, err := x509.ParseCertificate(certPem.Bytes)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		now := time.Now()
		certTemplate := &x509.Certificate{
			SerialNumber: big.NewInt(1),
			Subject: pkix.Name{
				Country:            cert.Subject.Country,
				Province:           cert.Subject.Province,
				Locality:           cert.Subject.Locality,
				CommonName:         cert.Subject.CommonName,
				Organization:       cert.Subject.Organization,
				OrganizationalUnit: cert.Subject.OrganizationalUnit,
			},
			NotBefore: now,
			NotAfter:  now.AddDate(0, 0, req.ValidDays),
		}
		newCert, err := x509.CreateCertificate(rand.Reader, certTemplate, certTemplate, key.Public(), key)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		certPemBytes := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: newCert})
		err = client.Certificate.UpdateOne(certData).SetCertPem(string(certPemBytes)).Exec(context.Background())
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, map[string]string{"message": "succeed"})
	})
}
