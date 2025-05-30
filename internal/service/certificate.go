package service

import (
	"context"
	"crypto"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"math"
	"math/big"
	"time"

	"github.com/logeable/certmgr/internal/ent"
	"github.com/logeable/certmgr/internal/ent/certificate"
)

type CertificateService struct {
	ctx *ServiceContext
}

func NewCertificateService(ctx *ServiceContext) *CertificateService {
	return &CertificateService{
		ctx: ctx,
	}
}

func (s *CertificateService) CreateCertificate(ctx context.Context, req CreateCertReq) (*Certificate, error) {
	newKey, err := createPrivateKey(req.KeyType, req.KeyLen)
	if err != nil {
		return nil, fmt.Errorf("create private key failed: %w", err)
	}

	serialNumber, err := rand.Int(rand.Reader, big.NewInt(math.MaxInt64))
	if err != nil {
		return nil, fmt.Errorf("generate serial number failed: %w", err)
	}
	now := time.Now()
	certTemplate := &x509.Certificate{
		SerialNumber:          serialNumber,
		Subject:               req.Subject.ToPkixName(),
		NotBefore:             now,
		NotAfter:              now.AddDate(0, 0, req.ValidDays),
		KeyUsage:              req.Usage.ToKeyUsage(),
		ExtKeyUsage:           req.ExtendedUsage.ToExtKeyUsage(),
		BasicConstraintsValid: true,
		IsCA:                  req.BasicConstraints.CA,
		MaxPathLenZero:        false,
	}

	parentCert := certTemplate
	signKey := newKey
	if req.IssuerId != 0 {
		issuer, err := s.ctx.client.Certificate.Get(ctx, req.IssuerId)
		if err != nil {
			return nil, fmt.Errorf("get issuer failed: %w", err)
		}
		parentCert, err = getCertFromPem(issuer.CertPem)
		if err != nil {
			return nil, fmt.Errorf("get issuer (%d) cert from pem failed: %w", req.IssuerId, err)
		}
		signKey, err = getPrivateKeyFromPem(issuer.KeyPem)
		if err != nil {
			return nil, fmt.Errorf("get issuer (%d) key from pem failed: %w", req.IssuerId, err)
		}
	}

	pubKey := newKey.(crypto.Signer).Public()
	certDer, err := x509.CreateCertificate(rand.Reader, certTemplate, parentCert, pubKey, signKey)
	if err != nil {
		return nil, fmt.Errorf("create x509certificate failed: %w", err)
	}

	x509Cert, err := x509.ParseCertificate(certDer)
	if err != nil {
		return nil, fmt.Errorf("parse x509 certificate failed: %w", err)
	}

	certPemBytes := x509CertToPem(x509Cert)
	keyPemBytes := PrivateKeyToPem(newKey)

	createdCert, err := s.ctx.client.Certificate.Create().
		SetNamespaceID(req.NamespaceId).
		SetIssuerID(req.IssuerId).
		SetCertPem(string(certPemBytes)).
		SetKeyPem(string(keyPemBytes)).
		SetDesc(req.Desc).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("save to db failed: %w", err)
	}

	return &Certificate{
		ID:          createdCert.ID,
		NamespaceID: createdCert.NamespaceID,
		Desc:        createdCert.Desc,
		IssuerID:    createdCert.IssuerID,
		UpdatedAt:   createdCert.UpdatedAt,
		CreatedAt:   createdCert.CreatedAt,
		CertPem:     string(certPemBytes),
		KeyPem:      string(keyPemBytes),
		Subject:     getSubject(x509Cert),
	}, nil
}

func (s *CertificateService) ListCertificates(ctx context.Context, namespaceId int) ([]Certificate, error) {
	var result []Certificate
	certs, err := s.ctx.client.Certificate.Query().Where(certificate.NamespaceID(namespaceId)).All(ctx)
	if err != nil {
		return nil, fmt.Errorf("query certificates failed: %w", err)
	}
	for _, cert := range certs {
		subject, err := getSubjectFromPem(cert.CertPem)
		if err != nil {
			return nil, fmt.Errorf("get subject of cert %d failed: %w", cert.ID, err)
		}
		result = append(result, Certificate{
			ID:          cert.ID,
			NamespaceID: cert.NamespaceID,
			Desc:        cert.Desc,
			IssuerID:    cert.IssuerID,
			UpdatedAt:   cert.UpdatedAt,
			CreatedAt:   cert.CreatedAt,
			Subject:     subject,
			CertPem:     cert.CertPem,
			KeyPem:      cert.KeyPem,
		})
	}
	return result, nil
}

func (s *CertificateService) DeleteCertificate(ctx context.Context, id int) error {
	s.ctx.withTx(ctx, func(tx *ent.Tx) error {
		_, err := tx.Certificate.Get(ctx, id)
		if err != nil {
			return fmt.Errorf("get cert %d failed: %w", id, err)
		}
		subCerts, err := s.FindAllSubCertificates(ctx, id)
		if err != nil {
			return fmt.Errorf("find all sub certs of cert %d failed: %w", id, err)
		}
		for _, subCert := range subCerts {
			err = tx.Certificate.DeleteOneID(subCert.ID).Exec(ctx)
			if err != nil {
				return fmt.Errorf("delete sub cert %d failed: %w", subCert.ID, err)
			}
		}
		err = tx.Certificate.DeleteOneID(id).Exec(ctx)
		if err != nil {
			return fmt.Errorf("delete cert %d failed: %w", id, err)
		}
		return nil
	})
	return nil
}

func (s *CertificateService) RenewCertificate(ctx context.Context, id int, validDays int) error {
	cert, err := s.ctx.client.Certificate.Get(ctx, id)
	if err != nil {
		return fmt.Errorf("get cert %d failed: %w", id, err)
	}

	x509Cert, err := getCertFromPem(cert.CertPem)
	if err != nil {
		return fmt.Errorf("get cert %d from pem failed: %w", id, err)
	}
	key, err := getPrivateKeyFromPem(cert.KeyPem)
	if err != nil {
		return fmt.Errorf("get private key %d from pem failed: %w", id, err)
	}

	now := time.Now()
	certTemplate := &x509.Certificate{
		SerialNumber:          x509Cert.SerialNumber,
		Subject:               x509Cert.Subject,
		NotBefore:             now,
		NotAfter:              now.AddDate(0, 0, validDays),
		KeyUsage:              x509Cert.KeyUsage,
		ExtKeyUsage:           x509Cert.ExtKeyUsage,
		BasicConstraintsValid: true,
		IsCA:                  x509Cert.IsCA,
		MaxPathLenZero:        false,
	}

	issuerCert, err := s.ctx.client.Certificate.Get(ctx, cert.IssuerID)
	if err != nil {
		return fmt.Errorf("get issuer failed: %w", err)
	}
	issuerX509Cert, err := getCertFromPem(issuerCert.CertPem)
	if err != nil {
		return fmt.Errorf("get issuer (%d) cert from pem failed: %w", cert.IssuerID, err)
	}
	issuerPrivateKey, err := getPrivateKeyFromPem(issuerCert.KeyPem)
	if err != nil {
		return fmt.Errorf("get issuer (%d) private key from pem failed: %w", cert.IssuerID, err)
	}
	pubKey := key.(crypto.Signer).Public()
	certDer, err := x509.CreateCertificate(rand.Reader, certTemplate, issuerX509Cert, pubKey, issuerPrivateKey)
	if err != nil {
		return fmt.Errorf("create x509 certificate failed: %w", err)
	}

	newX509Cert, err := x509.ParseCertificate(certDer)
	if err != nil {
		return fmt.Errorf("parse x509 certificate failed: %w", err)
	}

	certPemBytes := x509CertToPem(newX509Cert)
	err = s.ctx.client.Certificate.UpdateOne(cert).SetCertPem(string(certPemBytes)).Exec(ctx)
	if err != nil {
		return fmt.Errorf("update cert %d failed: %w", id, err)
	}
	return nil
}

func (s *CertificateService) FindAllSubCertificates(ctx context.Context, id int) ([]*ent.Certificate, error) {
	var result []*ent.Certificate

	var dfs func(id int) error
	dfs = func(id int) error {
		certs, err := s.ctx.client.Certificate.Query().Where(certificate.IssuerIDEQ(id)).All(ctx)
		if err != nil {
			return fmt.Errorf("query sub certs of cert %d failed: %w", id, err)
		}
		for _, subCert := range certs {
			result = append(result, subCert)
			err = dfs(subCert.ID)
			if err != nil {
				return fmt.Errorf("dfs of cert %d failed: %w", subCert.ID, err)
			}
		}
		return nil
	}

	err := dfs(id)
	if err != nil {
		return nil, fmt.Errorf("dfs failed: %w", err)
	}
	return result, nil
}

type Subject struct {
	Country    string `json:"country"`
	State      string `json:"state"`
	City       string `json:"city"`
	Org        string `json:"org"`
	Ou         string `json:"ou"`
	CommonName string `json:"commonName"`
}

func (s *Subject) ToPkixName() pkix.Name {
	return pkix.Name{
		Country:            []string{s.Country},
		Province:           []string{s.State},
		Locality:           []string{s.City},
		CommonName:         s.CommonName,
		Organization:       []string{s.Org},
		OrganizationalUnit: []string{s.Ou},
	}
}

type Usage struct {
	DigitalSignature bool `json:"digitalSignature"`
	KeyEncipherment  bool `json:"keyEncipherment"`
	KeyCertSign      bool `json:"keyCertSign"`
	CRLSign          bool `json:"cRLSign"`
	ServerAuth       bool `json:"serverAuth"`
	ClientAuth       bool `json:"clientAuth"`
	CodeSigning      bool `json:"codeSigning"`
	CA               bool `json:"ca"`
}

func (u *Usage) ToKeyUsage() x509.KeyUsage {
	var ku x509.KeyUsage
	if u.DigitalSignature {
		ku |= x509.KeyUsageDigitalSignature
	}
	if u.KeyEncipherment {
		ku |= x509.KeyUsageKeyEncipherment
	}
	if u.KeyCertSign {
		ku |= x509.KeyUsageCertSign
	}
	if u.CRLSign {
		ku |= x509.KeyUsageCRLSign
	}
	return ku
}

type ExtendedUsage struct {
	ServerAuth  bool `json:"serverAuth"`
	ClientAuth  bool `json:"clientAuth"`
	CodeSigning bool `json:"codeSigning"`
}

func (u *ExtendedUsage) ToExtKeyUsage() []x509.ExtKeyUsage {
	var eku []x509.ExtKeyUsage
	if u.ServerAuth {
		eku = append(eku, x509.ExtKeyUsageServerAuth)
	}
	if u.ClientAuth {
		eku = append(eku, x509.ExtKeyUsageClientAuth)
	}
	if u.CodeSigning {
		eku = append(eku, x509.ExtKeyUsageCodeSigning)
	}
	return eku
}

type BasicConstraints struct {
	CA bool `json:"ca"`
}

type Certificate struct {
	ID          int
	NamespaceID int
	Desc        string
	CertPem     string
	KeyPem      string
	IssuerID    int
	UpdatedAt   time.Time
	CreatedAt   time.Time
	Subject     string
}

type CreateCertReq struct {
	NamespaceId      int              `json:"namespaceId"`
	IssuerId         int              `json:"issuerId"`
	KeyType          string           `json:"keyType"`
	KeyLen           int              `json:"keyLen"`
	ValidDays        int              `json:"validDays"`
	Desc             string           `json:"desc"`
	Subject          Subject          `json:"subject"`
	Usage            Usage            `json:"usage"`
	ExtendedUsage    ExtendedUsage    `json:"extendedUsage"`
	BasicConstraints BasicConstraints `json:"basicConstraints"`
	DNSNames         []string         `json:"dnsNames"`
	IPAddresses      []string         `json:"ipAddresses"`
}

func getCertFromPem(certPem string) (*x509.Certificate, error) {
	certPemBytes, _ := pem.Decode([]byte(certPem))
	if certPemBytes == nil {
		return nil, fmt.Errorf("decode certPem failed")
	}
	return x509.ParseCertificate(certPemBytes.Bytes)
}

func getPrivateKeyFromPem(keyPem string) (crypto.PrivateKey, error) {
	keyPemBytes, _ := pem.Decode([]byte(keyPem))
	if keyPemBytes == nil {
		return nil, fmt.Errorf("decode keyPem failed")
	}
	return x509.ParsePKCS8PrivateKey(keyPemBytes.Bytes)
}

func getSubjectFromPem(certPem string) (string, error) {
	cert, err := getCertFromPem(certPem)
	if err != nil {
		return "", fmt.Errorf("get cert from pem failed: %w", err)
	}
	return getSubject(cert), nil
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

func rawCertToPem(cert []byte) []byte {
	return pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: cert})
}

func x509CertToPem(cert *x509.Certificate) []byte {
	return rawCertToPem(cert.Raw)
}

func PrivateKeyToPem(key crypto.PrivateKey) []byte {
	pkcs8, err := x509.MarshalPKCS8PrivateKey(key)
	if err != nil {
		return nil
	}
	return pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: pkcs8})
}

func createPrivateKey(keyType string, keyLen int) (crypto.PrivateKey, error) {
	switch keyType {
	case "RSA":
		return rsa.GenerateKey(rand.Reader, keyLen)
	case "ECDSA":
		return ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	default:
		return nil, fmt.Errorf("unsupported key type: %s", keyType)
	}
}
