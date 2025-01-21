package handlers

import (
	"log"
	"net/http"
)

func PingHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	if _, err := w.Write([]byte("pong")); err != nil {
		log.Println("Error, network failed")
	}
}
