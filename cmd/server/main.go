package main

import (
	"Sneszana/handlers"
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

func main() {
	r := mux.NewRouter()
	apiRouter := r.PathPrefix("/api").Subrouter()

	apiRouter.HandleFunc("/ping", handlers.PingHandler).Methods("GET")
	log.Printf("Server listening on port 8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
