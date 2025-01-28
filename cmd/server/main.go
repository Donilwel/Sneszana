package main

import (
	"Sneszana/config"
	"Sneszana/database/migrations"
	"Sneszana/handlers"
	"Sneszana/utils"
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

func main() {
	config.LoadEnv()
	migrations.InitDB()
	r := mux.NewRouter()
	apiRouter := r.PathPrefix("/api").Subrouter()
	apiRouter.HandleFunc("/ping", handlers.PingHandler).Methods("GET")

	restaurantsRouter := apiRouter.PathPrefix("/restaurants").Subrouter()
	authRouter := apiRouter.PathPrefix("/auth").Subrouter()
	courierRouter := apiRouter.PathPrefix("/courier").Subrouter()

	authRouter.HandleFunc("/register", handlers.RegisterHandler).Methods("POST")
	authRouter.HandleFunc("/login", handlers.LoginHandler).Methods("POST")

	ordersRouter := apiRouter.PathPrefix("/orders").Subrouter()
	ordersRouter.Use(utils.AuthMiddleware)
	ordersRouter.HandleFunc("/", handlers.ShowOrderHandler).Methods("GET")
	ordersRouter.HandleFunc("/", handlers.CreateOrderHandler).Methods("POST")
	ordersRouter.HandleFunc("/{id}", handlers.UpdateOrderHandler).Methods("PUT")
	ordersRouter.HandleFunc("/{id}", handlers.DeleteOrderHandler).Methods("DELETE")

	courierRouter.HandleFunc("/status", handlers.DeleteOrderHandler).Methods("GET")
	courierRouter.HandleFunc("/status/set", handlers.ShowOrderHandler).Methods("PUT")

	restaurantsRouter.HandleFunc("/restaurants/{id}/menu", handlers.RestaurantsMenuHandler).Methods("GET")
	log.Printf("Server listening on port 8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
