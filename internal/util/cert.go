package util

import (
	"context"
	"crypto/x509"
	"fmt"

	"github.com/logeable/certmgr/ent"
	"github.com/logeable/certmgr/ent/certificate"
)

func FindAllSubCertificates(client *ent.Client, cert *ent.Certificate) ([]*ent.Certificate, error) {
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

func GetSubject(cert *x509.Certificate) string {
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
