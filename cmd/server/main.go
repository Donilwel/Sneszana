package main

import (
	"Sneszana/config"
	"Sneszana/database/migrations"
	"Sneszana/handlers"
	"Sneszana/models"
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

	dishesRouter := apiRouter.PathPrefix("/dishes").Subrouter()
	dishesRouter.HandleFunc("", handlers.ShowDishesHandler).Methods("GET")
	dishesRouter.HandleFunc("/{id}", handlers.ShowDishByIDHandler).Methods("GET")
	dishesRouter.HandleFunc("/{id}/reviews", handlers.ShowReviewsDishByIDHandler).Methods("GET")

	authRouter := apiRouter.PathPrefix("/auth").Subrouter()
	authRouter.HandleFunc("/register", handlers.RegisterHandler).Methods("POST")
	authRouter.HandleFunc("/login", handlers.LoginHandler).Methods("POST")
	authRouter.HandleFunc("/logout", handlers.LogoutHandler).Methods("POST")

	ordersRouter := apiRouter.PathPrefix("/orders").Subrouter()
	ordersRouter.Use(utils.AuthMiddleware(models.CUSTOMER_ROLE))
	ordersRouter.HandleFunc("/", handlers.ShowOrderHandler).Methods("GET")
	ordersRouter.HandleFunc("/", handlers.CreateOrderHandler).Methods("POST")
	ordersRouter.HandleFunc("/{id}", handlers.UpdateOrderHandler).Methods("PUT")
	ordersRouter.HandleFunc("/delete", handlers.DeleteOrderHandler).Methods("DELETE")
	ordersRouter.HandleFunc("/{id}/add", handlers.AddToBucketHandler).Methods("POST")

	//оставить отзыв на блюдо может человек который купил когда-то этот товар
	ordersRouter.HandleFunc("/{id}/setReview", handlers.SetReviewHandler).Methods("POST")

	adminRouter := apiRouter.PathPrefix("/admin").Subrouter()
	adminRouter.Use(utils.AuthMiddleware(models.ADMIN_ROLE))
	adminRouter.HandleFunc("/couriers", handlers.ShowAllCouriersHandler).Methods("GET")
	adminRouter.HandleFunc("/{id}/courier", handlers.ShowCourierHandler).Methods("GET")
	adminRouter.HandleFunc("/setRole/{username}", handlers.SetRolesHandler).Methods("PUT")
	adminRouter.HandleFunc("/dishes/delete", handlers.DeleteDishesHandler).Methods("DELETE")
	adminRouter.HandleFunc("/dishes/{id}", handlers.ChangePriceHandler).Methods("PUT")
	adminRouter.HandleFunc("/dishes", handlers.ShowAllDishesHandler).Methods("GET")

	courierRouter := apiRouter.PathPrefix("/courier").Subrouter()
	courierRouter.Use(utils.AuthMiddleware(models.COURIER_ROLE))
	courierRouter.HandleFunc("", handlers.ShowCourierInformationHandler).Methods("GET")
	courierRouter.HandleFunc("/status/set", handlers.SetStatusCourierHandler).Methods("PUT")
	courierRouter.HandleFunc("/orders/show", handlers.GetActuallOrdersHandler).Methods("GET")
	restaurantsRouter := apiRouter.PathPrefix("/restaurants").Subrouter()
	restaurantsRouter.HandleFunc("/restaurants/{id}/menu", handlers.RestaurantsMenuHandler).Methods("GET")
	log.Printf("Server listening on port 8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
