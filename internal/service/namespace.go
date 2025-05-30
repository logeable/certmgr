package service

import (
	"context"

	"github.com/logeable/certmgr/ent"
)

type NamespaceInput struct {
	Name string
	Desc string
}

func CreateNamespace(ctx context.Context, client *ent.Client, input NamespaceInput) (*ent.Namespace, error) {
	return client.Namespace.Create().SetName(input.Name).SetDesc(input.Desc).Save(ctx)
}

func UpdateNamespace(ctx context.Context, client *ent.Client, id int, input NamespaceInput) (*ent.Namespace, error) {
	_, err := client.Namespace.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	err = client.Namespace.UpdateOneID(id).SetName(input.Name).SetDesc(input.Desc).Exec(ctx)
	if err != nil {
		return nil, err
	}
	return client.Namespace.Get(ctx, id)
}

func DeleteNamespace(ctx context.Context, client *ent.Client, id int) error {
	return client.Namespace.DeleteOneID(id).Exec(ctx)
}

func GetNamespace(ctx context.Context, client *ent.Client, id int) (*ent.Namespace, error) {
	return client.Namespace.Get(ctx, id)
}

func ListNamespaces(ctx context.Context, client *ent.Client) ([]*ent.Namespace, error) {
	return client.Namespace.Query().All(ctx)
}
