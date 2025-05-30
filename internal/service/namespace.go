package service

import (
	"context"
	"fmt"
	"time"

	"github.com/logeable/certmgr/internal/ent"
	"github.com/logeable/certmgr/internal/ent/certificate"
)

type NamespaceService struct {
	ctx *ServiceContext
}

func NewNamespaceService(ctx *ServiceContext) *NamespaceService {
	return &NamespaceService{
		ctx: ctx,
	}
}

func (s *NamespaceService) CreateNamespace(ctx context.Context, req ent.Namespace) (*ent.Namespace, error) {
	ns, err := s.ctx.client.Namespace.Create().SetName(req.Name).SetDesc(req.Desc).Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("db save failed: %w", err)
	}
	return ns, nil
}

func (s *NamespaceService) UpdateNamespace(ctx context.Context, id int, req ent.Namespace) (*ent.Namespace, error) {
	_, err := s.ctx.client.Namespace.Get(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("db check namespace exist failed: %w", err)
	}
	err = s.ctx.client.Namespace.UpdateOneID(id).SetName(req.Name).SetDesc(req.Desc).Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("db update failed: %w", err)
	}
	ns, err := s.ctx.client.Namespace.Get(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("db get failed: %w", err)
	}
	return ns, nil
}

func (s *NamespaceService) DeleteNamespace(ctx context.Context, id int) error {
	err := s.ctx.client.Namespace.DeleteOneID(id).Exec(ctx)
	if err != nil {
		return fmt.Errorf("db delete failed: %w", err)
	}
	return nil
}

func (s *NamespaceService) GetNamespace(ctx context.Context, id int) (*ent.Namespace, error) {
	ns, err := s.ctx.client.Namespace.Get(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("db get failed: %w", err)
	}
	return ns, nil
}

type Namespace struct {
	ID        int
	Name      string
	Desc      string
	UpdatedAt time.Time
	CreatedAt time.Time
	CertCount int
}

func (s *NamespaceService) ListNamespaces(ctx context.Context) ([]Namespace, error) {
	var result []Namespace
	err := s.ctx.withTx(ctx, func(tx *ent.Tx) error {
		ns, err := tx.Namespace.Query().All(ctx)
		if err != nil {
			return fmt.Errorf("query namespaces failed: %w", err)
		}
		for _, namespace := range ns {
			certCount, err := tx.Certificate.Query().Where(certificate.NamespaceID(namespace.ID)).Count(ctx)
			if err != nil {
				return fmt.Errorf("query cert count of namespace %d failed: %w", namespace.ID, err)
			}
			ns := entToNamespace(namespace)
			ns.CertCount = certCount
			result = append(result, ns)
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("list namespaces failed: %w", err)
	}
	return result, nil
}

func entToNamespace(ns *ent.Namespace) Namespace {
	return Namespace{
		ID:        ns.ID,
		Name:      ns.Name,
		Desc:      ns.Desc,
		UpdatedAt: ns.UpdatedAt,
		CreatedAt: ns.CreatedAt,
	}
}
