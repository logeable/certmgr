package service

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"math/big"

	"github.com/logeable/certmgr/ent"
	"go.uber.org/zap"
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
			wrapErr := fmt.Errorf("CreateCertificate: generate key failed (namespaceId=%d, keyLen=%d): %w", input.NamespaceId, input.KeyLen, err)
			zap.L().Error(wrapErr.Error())
			return nil, nil, nil, wrapErr
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
			wrapErr := fmt.Errorf("CreateCertificate: create cert failed (namespaceId=%d): %w", input.NamespaceId, err)
			zap.L().Error(wrapErr.Error())
			return nil, nil, nil, wrapErr
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
			wrapErr := fmt.Errorf("CreateCertificate: save to db failed (namespaceId=%d): %w", input.NamespaceId, err)
			zap.L().Error(wrapErr.Error())
			return nil, nil, nil, wrapErr
		}
		return entCert, certPemBytes, keyPemBytes, nil
	}
	wrapErr := fmt.Errorf("CreateCertificate: unsupported key type %s (namespaceId=%d)", input.KeyType, input.NamespaceId)
	zap.L().Error(wrapErr.Error())
	return nil, nil, nil, wrapErr
}
