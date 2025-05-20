package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/logeable/certmgr/ent"
	_ "github.com/mattn/go-sqlite3"
)

var port = flag.Int("port", 0, "port to listen on")

func main() {
	flag.Parse()

	dbPath := filepath.Join(os.Getenv("HOME"), ".certmgr", "certmgr.db")
	err := os.MkdirAll(filepath.Dir(dbPath), 0755)
	if err != nil {
		log.Fatal(err)
	}
	
	client, err := ent.Open("sqlite3", "file:"+dbPath+"?cache=shared&_fk=1")
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	if err := client.Schema.Create(context.Background()); err != nil {
		log.Fatal(err)
	}
	log.Println("Database created")


	e := echo.New()
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hello, World!")
	})
	e.GET("/status", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})	

	err = e.Start("127.0.0.1:" + strconv.Itoa(*port))
	if err != nil {
		log.Fatal(err)
	}
}