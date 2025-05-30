package service

import (
	"context"
	"fmt"

	"github.com/logeable/certmgr/ent"
	"go.uber.org/zap"
)

type NamespaceInput struct {
	Name string
	Desc string
}

func CreateNamespace(ctx context.Context, client *ent.Client, input NamespaceInput) (*ent.Namespace, error) {
	ns, err := client.Namespace.Create().SetName(input.Name).SetDesc(input.Desc).Save(ctx)
	if err != nil {
		wrapErr := fmt.Errorf("CreateNamespace: save failed (name=%s): %w", input.Name, err)
		zap.L().Error(wrapErr.Error())
		return nil, wrapErr
	}
	return ns, nil
}

func UpdateNamespace(ctx context.Context, client *ent.Client, id int, input NamespaceInput) (*ent.Namespace, error) {
	_, err := client.Namespace.Get(ctx, id)
	if err != nil {
		wrapErr := fmt.Errorf("UpdateNamespace: get failed (id=%d): %w", id, err)
		zap.L().Error(wrapErr.Error())
		return nil, wrapErr
	}
	err = client.Namespace.UpdateOneID(id).SetName(input.Name).SetDesc(input.Desc).Exec(ctx)
	if err != nil {
		wrapErr := fmt.Errorf("UpdateNamespace: update failed (id=%d): %w", id, err)
		zap.L().Error(wrapErr.Error())
		return nil, wrapErr
	}
	updated, err := client.Namespace.Get(ctx, id)
	if err != nil {
		wrapErr := fmt.Errorf("UpdateNamespace: get after update failed (id=%d): %w", id, err)
		zap.L().Error(wrapErr.Error())
		return nil, wrapErr
	}
	return updated, nil
}

func DeleteNamespace(ctx context.Context, client *ent.Client, id int) error {
	err := client.Namespace.DeleteOneID(id).Exec(ctx)
	if err != nil {
		wrapErr := fmt.Errorf("DeleteNamespace: delete failed (id=%d): %w", id, err)
		zap.L().Error(wrapErr.Error())
		return wrapErr
	}
	return nil
}

func GetNamespace(ctx context.Context, client *ent.Client, id int) (*ent.Namespace, error) {
	ns, err := client.Namespace.Get(ctx, id)
	if err != nil {
		wrapErr := fmt.Errorf("GetNamespace: get failed (id=%d): %w", id, err)
		zap.L().Error(wrapErr.Error())
		return nil, wrapErr
	}
	return ns, nil
}

func ListNamespaces(ctx context.Context, client *ent.Client) ([]*ent.Namespace, error) {
	ns, err := client.Namespace.Query().All(ctx)
	if err != nil {
		wrapErr := fmt.Errorf("ListNamespaces: query failed: %w", err)
		zap.L().Error(wrapErr.Error())
		return nil, wrapErr
	}
	return ns, nil
}
