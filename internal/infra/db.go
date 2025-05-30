package infra

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/logeable/certmgr/internal/ent"
)

func InitDB() (*ent.Client, error) {
	dbPath := filepath.Join(os.Getenv("HOME"), ".certmgr", "certmgr.db")
	err := os.MkdirAll(filepath.Dir(dbPath), 0755)
	if err != nil {
		return nil, fmt.Errorf("failed to create db dir: %w", err)
	}

	client, err := ent.Open("sqlite3", "file:"+dbPath+"?cache=shared&_fk=1")
	if err != nil {
		return nil, fmt.Errorf("failed to open db: %w", err)
	}

	if err := client.Schema.Create(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to create schema: %w", err)
	}

	return client, nil
}
