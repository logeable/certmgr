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
	api := e.Group("/api/v1")
	namespaces := api.Group("/namespaces")
	namespaces.GET("/", func(c echo.Context) error {
		namespaces, err := client.Namespace.Query().All(context.Background())
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		type NamespaceResponse struct {
			ID   int `json:"id"`
			Name string `json:"name"`
		}
		resp := make([]NamespaceResponse,0, len(namespaces))
		for _, namespace := range namespaces {
			resp = append(resp, NamespaceResponse{
				ID:   namespace.ID,
				Name: namespace.Name,
			})
		}
		return c.JSON(http.StatusOK, resp)
	})
	namespaces.POST("/", func(c echo.Context) error {
		type NamespaceRequest struct {
			Name string `json:"name"`
		}
		var req NamespaceRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		namespace, err := client.Namespace.Create().SetName(req.Name).Save(context.Background())
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, map[string]string{"id": strconv.Itoa(namespace.ID)})
	})
	namespaces.GET("/:id", func(c echo.Context) error {
		id := c.Param("id")
		idInt, err := strconv.Atoi(id)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		namespace, err := client.Namespace.Get(context.Background(), idInt)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, namespace)
	})

	e.GET("/status", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})	

	for _, route := range e.Routes() {
		log.Println(route.Method, route.Path)
	}

	err = e.Start("127.0.0.1:" + strconv.Itoa(*port))
	if err != nil {
		log.Fatal(err)
	}
}