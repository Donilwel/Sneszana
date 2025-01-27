package handlers

import (
	"Sneszana/database/migrations"
	"Sneszana/models"
	"github.com/gorilla/mux"
	"log"
	"net/http"
	"strconv"
)

func RestaurantsMenuHandler(w http.ResponseWriter, r *http.Request) {

	params := mux.Vars(r)["id"]
	restaurantID, err := strconv.Atoi(params)
	if err != nil {
		log.Println("wrong ID restaurant")
		http.Error(w, "wrong ID restaurant", http.StatusBadRequest)
		return
	}

	var restaurants []models.Restaurant
	if err := migrations.DB.First(&restaurants, restaurantID).Error; err != nil {
		log.Println("ID is wrong. restaurant not found")
		http.Error(w, "ID is wrong. restaurant not found", http.StatusNotFound)
		return
	}

}
