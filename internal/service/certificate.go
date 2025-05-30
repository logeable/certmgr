package service

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"math/big"

	"github.com/logeable/certmgr/ent"
)

type Subject struct {
	Country    string
	State      string
	City       string
	Org        string
	Ou         string
	CommonName string
}

type CreateCertInput struct {
	NamespaceId int
	IssuerId    int
	KeyType     string
	KeyLen      int
	Desc        string
	Subject     Subject
}

func CreateCertificate(ctx context.Context, client *ent.Client, input CreateCertInput) (*ent.Certificate, []byte, []byte, error) {
	if input.KeyType == "RSA" {
		key, err := rsa.GenerateKey(rand.Reader, input.KeyLen)
		if err != nil {
			return nil, nil, nil, err
		}
		certTemplate := &x509.Certificate{
			SerialNumber: big.NewInt(1),
			Subject: pkix.Name{
				Country:            []string{input.Subject.Country},
				Province:           []string{input.Subject.State},
				Locality:           []string{input.Subject.City},
				CommonName:         input.Subject.CommonName,
				Organization:       []string{input.Subject.Org},
				OrganizationalUnit: []string{input.Subject.Ou},
			},
		}
		cert, err := x509.CreateCertificate(rand.Reader, certTemplate, certTemplate, key.Public(), key)
		if err != nil {
			return nil, nil, nil, err
		}
		certPemBytes := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: cert})
		keyPemBytes := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)})
		entCert, err := client.Certificate.Create().
			SetNamespaceID(input.NamespaceId).
			SetIssuerID(input.IssuerId).
			SetCertPem(string(certPemBytes)).
			SetKeyPem(string(keyPemBytes)).
			SetDesc(input.Desc).
			Save(ctx)
		if err != nil {
			return nil, nil, nil, err
		}
		return entCert, certPemBytes, keyPemBytes, nil
	}
	return nil, nil, nil, nil // 其他类型可扩展
}
