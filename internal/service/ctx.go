package service

import (
	"context"
	"fmt"

	"github.com/logeable/certmgr/internal/ent"
)

type ServiceContext struct {
	client *ent.Client
}

func NewServiceContext(client *ent.Client) *ServiceContext {
	return &ServiceContext{
		client: client,
	}
}

func (sctx *ServiceContext) withTx(ctx context.Context, fn func(tx *ent.Tx) error) error {
	tx, err := sctx.client.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx failed: %w", err)
	}
	defer func() {
		_ = tx.Rollback()
	}()

	err = fn(tx)
	if err != nil {
		return err
	}

	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("commit tx failed: %w", err)
	}

	return nil
}
