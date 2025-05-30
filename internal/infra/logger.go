package infra

import (
	"fmt"

	"go.uber.org/zap"
)

func InitLogger() (*zap.Logger, error) {
	logger, err := zap.NewDevelopment()
	if err != nil {
		return nil, fmt.Errorf("failed to init logger: %w", err)
	}
	return logger, nil
}
