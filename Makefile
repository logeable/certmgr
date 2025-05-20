.PHONY: bin
bin:
	mkdir -p bin
	go build -o bin/server cmd/server/main.go

dist: bin
	npm run make