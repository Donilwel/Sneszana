package main

import (
	"Sneszana/config"
	"Sneszana/database/migrations"
	"Sneszana/handlers"
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

func main() {
	config.LoadEnv()
	migrations.InitDB()
	r := mux.NewRouter()
	apiRouter := r.PathPrefix("/api").Subrouter()
	restaurantsRouter := apiRouter.PathPrefix("/restaurants").Subrouter()
	authRouter := apiRouter.PathPrefix("/auth").Subrouter()

	authRouter.HandleFunc("/register", handlers.RegisterHandler).Methods("POST")
	authRouter.HandleFunc("/login", handlers.LoginHandler).Methods("POST")

	apiRouter.HandleFunc("/ping", handlers.PingHandler).Methods("GET")

	restaurantsRouter.HandleFunc("/restaurants/{id}/menu", handlers.RestaurantsMenuHandler).Methods("GET")
	log.Printf("Server listening on port 8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
