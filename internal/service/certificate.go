package service

import (
	"archive/tar"
	"bytes"
	"context"
	"crypto"
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"math"
	"math/big"
	"net"
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
	count, err := s.ctx.client.Certificate.Query().
		Where(certificate.NamespaceID(req.NamespaceId), certificate.IssuerID(0)).
		Count(ctx)
	if err != nil {
		return nil, fmt.Errorf("count certificates failed: %w", err)
	}
	if count > 0 && req.IssuerId == 0 {
		return nil, fmt.Errorf("root certificate already exists")
	}
	newKey, err := createPrivateKey(req.KeyType, req)
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
		KeyUsage:              req.KeyUsage.ToKeyUsage(),
		ExtKeyUsage:           req.ExtendedKeyUsage.ToExtKeyUsage(),
		BasicConstraintsValid: true,
		IsCA:                  req.BasicConstraints.CA,
		MaxPathLenZero:        false,
		DNSNames:              req.DNSNames,
		IPAddresses:           buildIPAddresses(req.IPAddresses),
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
		if !parentCert.IsCA {
			return nil, fmt.Errorf("issuer (%d) is not a CA", req.IssuerId)
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
		SetUsage(req.Usage).
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
		IsCA:        x509Cert.IsCA,
	}, nil
}

func (s *CertificateService) ListCertificates(ctx context.Context, namespaceId int) ([]Certificate, error) {
	var result []Certificate
	certs, err := s.ctx.client.Certificate.Query().Where(certificate.NamespaceID(namespaceId)).All(ctx)
	if err != nil {
		return nil, fmt.Errorf("query certificates failed: %w", err)
	}
	for _, cert := range certs {
		x509Cert, err := getCertFromPem(cert.CertPem)
		if err != nil {
			return nil, fmt.Errorf("get cert %d from pem failed: %w", cert.ID, err)
		}
		result = append(result, Certificate{
			ID:          cert.ID,
			NamespaceID: cert.NamespaceID,
			Desc:        cert.Desc,
			IssuerID:    cert.IssuerID,
			UpdatedAt:   cert.UpdatedAt,
			CreatedAt:   cert.CreatedAt,
			Subject:     getSubject(x509Cert),
			IsCA:        x509Cert.IsCA,
			CertPem:     cert.CertPem,
			KeyPem:      cert.KeyPem,
			Usage:       cert.Usage,
		})
	}
	return result, nil
}

func (s *CertificateService) GetCertificate(ctx context.Context, id int) (*CertificateDetail, error) {
	cert, err := s.ctx.client.Certificate.Get(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get cert failed: %w", err)
	}

	subject, err := getSubjectFromPem(cert.CertPem)
	if err != nil {
		return nil, fmt.Errorf("get subject of cert %d failed: %w", cert.ID, err)
	}

	issuerSubject := subject
	if cert.IssuerID != 0 {
		issuerCert, err := s.ctx.client.Certificate.Get(ctx, cert.IssuerID)
		if err != nil {
			return nil, fmt.Errorf("get issuer cert %d failed: %w", cert.IssuerID, err)
		}
		issuerSubject, err = getSubjectFromPem(issuerCert.CertPem)
		if err != nil {
			return nil, fmt.Errorf("get issuer subject of cert %d failed: %w", cert.IssuerID, err)
		}
	}

	privateKey, err := getPrivateKeyFromPem(cert.KeyPem)
	if err != nil {
		return nil, fmt.Errorf("get private key %d from pem failed: %w", cert.ID, err)
	}

	x509Cert, err := getCertFromPem(cert.CertPem)
	if err != nil {
		return nil, fmt.Errorf("get cert %d from pem failed: %w", cert.ID, err)
	}

	var keyType string
	var keyLen int
	var eccCurve string
	switch privateKey.(type) {
	case *rsa.PrivateKey:
		keyType = "RSA"
		keyLen = x509Cert.PublicKey.(*rsa.PublicKey).N.BitLen()
	case *ecdsa.PrivateKey:
		keyType = "ECDSA"
		eccCurve = x509Cert.PublicKey.(*ecdsa.PublicKey).Curve.Params().Name
	case ed25519.PrivateKey:
		keyType = "ED25519"
	default:
		return nil, fmt.Errorf("unsupported key type: %T", privateKey)
	}

	return &CertificateDetail{
		ID:            cert.ID,
		Desc:          cert.Desc,
		UpdatedAt:     cert.UpdatedAt.Unix(),
		CreatedAt:     cert.CreatedAt.Unix(),
		Subject:       subject,
		IssuerID:      cert.IssuerID,
		IssuerSubject: issuerSubject,
		CertPem:       cert.CertPem,
		KeyPem:        cert.KeyPem,
		KeyType:       keyType,
		KeyLen:        keyLen,
		ECCCurve:      eccCurve,
		ValidDays:     int(x509Cert.NotAfter.Sub(x509Cert.NotBefore).Hours() / 24),
		NotBefore:     x509Cert.NotBefore.Unix(),
		NotAfter:      x509Cert.NotAfter.Unix(),
		KeyUsage:      formatKeyUsage(x509Cert.KeyUsage),
		ExtKeyUsage:   formatExtKeyUsage(x509Cert.ExtKeyUsage),
		DNSNames:      x509Cert.DNSNames,
		IPAddresses:   formatIPAddresses(x509Cert.IPAddresses),
		IsCA:          x509Cert.IsCA,
		Usage:         cert.Usage,
	}, nil
}

func (s *CertificateService) DeleteCertificate(ctx context.Context, id int) error {
	err := s.ctx.withTx(ctx, func(tx *ent.Tx) error {
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
	if err != nil {
		return fmt.Errorf("delete cert with tx failed: %w", err)
	}
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
		DNSNames:              x509Cert.DNSNames,
		IPAddresses:           x509Cert.IPAddresses,
	}

	issuerId := cert.IssuerID
	if issuerId == 0 {
		issuerId = cert.ID
	}
	issuerCert, err := s.ctx.client.Certificate.Get(ctx, issuerId)
	if err != nil {
		return fmt.Errorf("get issuer (%d) failed: %w", issuerId, err)
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

func (s *CertificateService) ExportCertificate(ctx context.Context, id int) ([]byte, error) {
	ancestors, err := s.findAllCertsAncestors(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("find all certs ancestors of cert %d failed: %w", id, err)
	}

	var tarBuf bytes.Buffer
	tw := tar.NewWriter(&tarBuf)

	var certData bytes.Buffer
	for _, cert := range ancestors {
		certData.WriteString(cert.CertPem)
		certData.WriteString("\n")
	}
	var keyData bytes.Buffer
	keyData.WriteString(ancestors[0].KeyPem)
	keyData.WriteString("\n")

	err = tw.WriteHeader(&tar.Header{
		Name: "certificate.pem",
		Size: int64(certData.Len()),
		Mode: 0644,
	})
	if err != nil {
		return nil, fmt.Errorf("write cert header to tar failed: %w", err)
	}
	_, err = tw.Write(certData.Bytes())
	if err != nil {
		return nil, fmt.Errorf("write cert data to tar failed: %w", err)
	}

	err = tw.WriteHeader(&tar.Header{
		Name: "key.pem",
		Size: int64(keyData.Len()),
		Mode: 0600,
	})
	if err != nil {
		return nil, fmt.Errorf("write key header to tar failed: %w", err)
	}
	_, err = tw.Write(keyData.Bytes())
	if err != nil {
		return nil, fmt.Errorf("write key data to tar failed: %w", err)
	}

	tw.Close()
	return tarBuf.Bytes(), nil
}

func (s *CertificateService) findAllCertsAncestors(ctx context.Context, id int) ([]*ent.Certificate, error) {
	var result []*ent.Certificate
	cert, err := s.ctx.client.Certificate.Get(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get cert %d failed: %w", id, err)
	}
	result = append(result, cert)
	if cert.IssuerID == 0 {
		return result, nil
	}
	ancestors, err := s.findAllCertsAncestors(ctx, cert.IssuerID)
	if err != nil {
		return nil, fmt.Errorf("find all certs ancestors of cert %d failed: %w", id, err)
	}
	result = append(result, ancestors...)
	return result, nil
}

type CertificateDetail struct {
	ID            int      `json:"id"`
	Desc          string   `json:"desc"`
	UpdatedAt     int64    `json:"updatedAt"`
	CreatedAt     int64    `json:"createdAt"`
	Subject       string   `json:"subject"`
	IssuerID      int      `json:"issuerId"`
	IssuerSubject string   `json:"issuerSubject"`
	CertPem       string   `json:"certPem"`
	KeyPem        string   `json:"keyPem"`
	KeyType       string   `json:"keyType"`
	KeyLen        int      `json:"keyLen"`
	ECCCurve      string   `json:"eccCurve"`
	ValidDays     int      `json:"validDays"`
	NotBefore     int64    `json:"notBefore"`
	NotAfter      int64    `json:"notAfter"`
	KeyUsage      []string `json:"keyUsage"`
	ExtKeyUsage   []string `json:"extKeyUsage"`
	DNSNames      []string `json:"dnsNames"`
	IPAddresses   []string `json:"ipAddresses"`
	IsCA          bool     `json:"isCA"`
	Usage         string   `json:"usage"`
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

type KeyUsage struct {
	DigitalSignature bool `json:"digitalSignature"`
	KeyEncipherment  bool `json:"keyEncipherment"`
	KeyCertSign      bool `json:"keyCertSign"`
	CRLSign          bool `json:"cRLSign"`
}

func (u *KeyUsage) ToKeyUsage() x509.KeyUsage {
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

type ExtendedKeyUsage struct {
	ServerAuth  bool `json:"serverAuth"`
	ClientAuth  bool `json:"clientAuth"`
	CodeSigning bool `json:"codeSigning"`
}

func (u *ExtendedKeyUsage) ToExtKeyUsage() []x509.ExtKeyUsage {
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
	IsCA        bool
	Usage       string
}

type CreateCertReq struct {
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

func createPrivateKey(keyType string, req CreateCertReq) (crypto.PrivateKey, error) {
	switch keyType {
	case "RSA":
		return rsa.GenerateKey(rand.Reader, req.KeyLen)
	case "ECDSA":
		var curve elliptic.Curve
		switch req.ECCCurve {
		case "P224":
			curve = elliptic.P224()
		case "P256":
			curve = elliptic.P256()
		case "P384":
			curve = elliptic.P384()
		case "P521":
			curve = elliptic.P521()
		default:
			return nil, fmt.Errorf("unsupported ecc curve: %s", req.ECCCurve)
		}
		return ecdsa.GenerateKey(curve, rand.Reader)
	case "ED25519":
		_, privateKey, err := ed25519.GenerateKey(rand.Reader)
		if err != nil {
			return nil, fmt.Errorf("generate ed25519 key failed: %w", err)
		}
		return privateKey, nil
	default:
		return nil, fmt.Errorf("unsupported key type: %s", keyType)
	}
}

func formatKeyUsage(ku x509.KeyUsage) []string {
	var result []string
	if ku&x509.KeyUsageDigitalSignature != 0 {
		result = append(result, "digitalSignature")
	}
	if ku&x509.KeyUsageKeyEncipherment != 0 {
		result = append(result, "keyEncipherment")
	}
	if ku&x509.KeyUsageCertSign != 0 {
		result = append(result, "keyCertSign")
	}
	if ku&x509.KeyUsageCRLSign != 0 {
		result = append(result, "cRLSign")
	}
	return result
}

func formatExtKeyUsage(eku []x509.ExtKeyUsage) []string {
	var result []string
	for _, e := range eku {
		switch e {
		case x509.ExtKeyUsageServerAuth:
			result = append(result, "serverAuth")
		case x509.ExtKeyUsageClientAuth:
			result = append(result, "clientAuth")
		case x509.ExtKeyUsageCodeSigning:
			result = append(result, "codeSigning")
		default:
			result = append(result, fmt.Sprintf("unknown(%d)", e))
		}
	}
	return result
}

func formatIPAddresses(ipAddresses []net.IP) []string {
	var result []string
	for _, ip := range ipAddresses {
		result = append(result, ip.String())
	}
	return result
}

func buildIPAddresses(ipAddresses []string) []net.IP {
	var result []net.IP
	for _, ip := range ipAddresses {
		result = append(result, net.ParseIP(ip))
	}
	return result
}
