package main

import (
	"flag"
	"log"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

var port = flag.Int("port", 0, "port to listen on")

func main() {
	flag.Parse()

	e := echo.New()
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hello, World!")
	})
	e.GET("/status", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})	

	err := e.Start("127.0.0.1:" + strconv.Itoa(*port))
	if err != nil {
		log.Fatal(err)
	}
}