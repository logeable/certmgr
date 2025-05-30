.PHONY: generate
generate:
	go generate ./internal/ent

.PHONY: bin
bin: generate
	mkdir -p bin
	go build -o bin/server cmd/server/main.go

dist: bin
	npm run make