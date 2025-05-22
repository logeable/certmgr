package main

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"flag"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/logeable/certmgr/ent"
	"github.com/logeable/certmgr/ent/certificate"
	_ "github.com/mattn/go-sqlite3"
)

var port = flag.Int("port", 0, "port to listen on")

func main() {
	flag.Parse()

	dbPath := filepath.Join(os.Getenv("HOME"), ".certmgr", "certmgr.db")
	err := os.MkdirAll(filepath.Dir(dbPath), 0755)
	if err != nil {
		log.Fatal(err)
	}

	client, err := ent.Open("sqlite3", "file:"+dbPath+"?cache=shared&_fk=1")
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	if err := client.Schema.Create(context.Background()); err != nil {
		log.Fatal(err)
	}
	log.Println("Database created")

	e := echo.New()

	e.Use(middleware.Logger())
	api := e.Group("/api/v1")
	namespaces := api.Group("/namespaces")
	namespaces.GET("/", func(c echo.Context) error {
		namespaces, err := client.Namespace.Query().All(context.Background())
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		type NamespaceResponse struct {
			ID        int    `json:"id"`
			Name      string `json:"name"`
			Desc      string `json:"desc"`
			CreatedAt int64  `json:"createdAt"`
			CertCount int    `json:"certCount"`
		}
		resp := make([]NamespaceResponse, 0, len(namespaces))
		for _, namespace := range namespaces {
			certCount, err := client.Certificate.Query().Where(certificate.NamespaceIDEQ(namespace.ID)).Count(context.Background())
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
			}
			resp = append(resp, NamespaceResponse{
				ID:        namespace.ID,
				Name:      namespace.Name,
				Desc:      namespace.Desc,
				CreatedAt: namespace.CreatedAt.Unix(),
				CertCount: certCount,
			})
		}
		return c.JSON(http.StatusOK, resp)
	})
	namespaces.POST("/", func(c echo.Context) error {
		type NamespaceRequest struct {
			Name string `json:"name"`
			Desc string `json:"desc"`
		}
		var req NamespaceRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		namespace, err := client.Namespace.Create().SetName(req.Name).SetDesc(req.Desc).Save(context.Background())
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, map[string]string{"id": strconv.Itoa(namespace.ID)})
	})
	namespaces.GET("/:id", func(c echo.Context) error {
		id := c.Param("id")
		idInt, err := strconv.Atoi(id)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		namespace, err := client.Namespace.Get(context.Background(), idInt)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, namespace)
	})
	namespaces.PUT("/:id", func(c echo.Context) error {
		id := c.Param("id")
		idInt, err := strconv.Atoi(id)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		type NamespaceRequest struct {
			Name string `json:"name"`
			Desc string `json:"desc"`
		}
		var req NamespaceRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		_, err = client.Namespace.Get(context.Background(), idInt)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		nsUpdate := client.Namespace.UpdateOneID(idInt).SetName(req.Name)
		nsUpdate = nsUpdate.SetDesc(req.Desc)
		if err := nsUpdate.Exec(context.Background()); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		updated, err := client.Namespace.Get(context.Background(), idInt)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, updated)
	})

	namespaces.DELETE("/:id", func(c echo.Context) error {
		id := c.Param("id")
		idInt, err := strconv.Atoi(id)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		err = client.Namespace.DeleteOneID(idInt).Exec(context.Background())
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, map[string]string{"message": "Namespace deleted"})
	})

	certificates := api.Group("/certificates")
	certificates.GET("/", func(c echo.Context) error {
		nsID := c.QueryParam("namespace_id")
		nsIDInt, err := strconv.Atoi(nsID)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid namespace_id"})
		}
		certs, err := client.Certificate.Query().Where(certificate.NamespaceIDEQ(nsIDInt)).All(context.Background())
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
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
				Subject:   getSubject(x509Cert),
				IssuerID:  cert.IssuerID,
			})
		}
		return c.JSON(http.StatusOK, resp)
	})

	certificates.POST("/", func(c echo.Context) error {
		type Subject struct {
			Country    string `json:"country"`
			State      string `json:"state"`
			City       string `json:"city"`
			Org        string `json:"org"`
			Ou         string `json:"ou"`
			CommonName string `json:"commonName"`
			Email      string `json:"email"`
		}
		type Req struct {
			NamespaceId string  `json:"namespaceId"`
			IssuerId    int     `json:"issuerId"`
			KeyType     string  `json:"keyType"`
			KeyLen      int     `json:"keyLen"`
			ValidDays   int     `json:"validDays"`
			Desc        string  `json:"desc"`
			Subject     Subject `json:"subject"`
		}
		var req Req
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		nsID, err := strconv.Atoi(req.NamespaceId)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid namespaceId"})
		}

		var certPemBytes []byte
		var keyPemBytes []byte
		if req.KeyType == "RSA" {
			key, err := rsa.GenerateKey(rand.Reader, req.KeyLen)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
			}
			certTemplate := &x509.Certificate{
				SerialNumber: big.NewInt(1),
				Subject: pkix.Name{
					Country:            []string{req.Subject.Country},
					Province:           []string{req.Subject.State},
					Locality:           []string{req.Subject.City},
					CommonName:         req.Subject.CommonName,
					Organization:       []string{req.Subject.Org},
					OrganizationalUnit: []string{req.Subject.Ou},
				},
			}
			cert, err := x509.CreateCertificate(rand.Reader, certTemplate, certTemplate, key.Public(), key)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
			}
			certPemBytes = pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: cert})
			keyPemBytes = pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)})
		}

		cert, err := client.Certificate.Create().
			SetNamespaceID(nsID).
			SetIssuerID(req.IssuerId).
			SetCertPem(string(certPemBytes)).
			SetKeyPem(string(keyPemBytes)).
			SetDesc(req.Desc).
			Save(context.Background())
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
			"id":        cert.ID,
			"desc":      cert.Desc,
			"certPem":   cert.CertPem,
			"keyPem":    cert.KeyPem,
			"createdAt": cert.CreatedAt.Unix(),
			"updatedAt": cert.UpdatedAt.Unix(),
			"subject":   getSubject(x509Cert),
		})
	})

	certificates.DELETE("/:id", func(c echo.Context) error {
		id := c.Param("id")
		idInt, err := strconv.Atoi(id)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}

		cert, err := client.Certificate.Get(context.Background(), idInt)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		subCerts, err := findAllSubCertificates(client, cert)
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

	certificates.POST("/:id/renew", func(c echo.Context) error {
		id := c.Param("id")
		idInt, err := strconv.Atoi(id)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}

		type Req struct {
			ValidDays int `json:"validDays"`
		}

		var req Req
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

	e.GET("/status", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	for _, route := range e.Routes() {
		log.Println(route.Method, route.Path)
	}

	err = e.Start("127.0.0.1:" + strconv.Itoa(*port))
	if err != nil {
		log.Fatal(err)
	}
}

func findAllSubCertificates(client *ent.Client, cert *ent.Certificate) ([]*ent.Certificate, error) {
	var result []*ent.Certificate

	var dfs func(cert *ent.Certificate) error
	dfs = func(cert *ent.Certificate) error {
		certs, err := client.Certificate.Query().Where(certificate.IssuerIDEQ(cert.ID)).All(context.Background())
		if err != nil {
			return err
		}
		for _, subCert := range certs {
			result = append(result, subCert)
			err = dfs(subCert)
			if err != nil {
				return err
			}
		}
		return nil
	}

	err := dfs(cert)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func getSubject(cert *x509.Certificate) string {
	subject := cert.Subject
	var subjectStr string
	for _, v := range subject.Country {
		subjectStr += fmt.Sprintf("C=%s", v)
	}
	for _, v := range subject.Province {
		subjectStr += fmt.Sprintf(", ST=%s", v)
	}
	for _, v := range subject.Locality {
		subjectStr += fmt.Sprintf(", L=%s", v)
	}
	for _, v := range subject.Organization {
		subjectStr += fmt.Sprintf(", O=%s", v)
	}
	for _, v := range subject.OrganizationalUnit {
		subjectStr += fmt.Sprintf(", OU=%s", v)
	}
	subjectStr += fmt.Sprintf(", CN=%s", subject.CommonName)
	return subjectStr
}
