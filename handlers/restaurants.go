package handlers

import (
	"Sneszana/database/migrations"
	"Sneszana/models"
	"Sneszana/utils"
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

func RestaurantsMenuHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID := r.URL.Query().Get("id")
	var dishes []models.Dish

	if restaurantID != "" {
		var restaurants models.Restaurant
		if err := migrations.DB.Where("id = ?", restaurantID).First(&restaurants).Error; err != nil {
			log.Println("restaurantID is uncorrect")
			http.Error(w, "restaurantID is uncorrect", http.StatusBadRequest)
			return
		}
		if err := migrations.DB.Where("restaurant_id = ?", restaurantID).Find(&dishes).Error; err != nil {
			log.Println("not have menu for this restaurantID")
			http.Error(w, "restaurantID is empty", http.StatusNotFound)
			return
		}
	} else {
		if err := migrations.DB.Find(&dishes).Error; err != nil {
			log.Println("not have menu")
			http.Error(w, "not have menu", http.StatusNotFound)
			return
		}
	}
	utils.JSONFormat(w, r, dishes)
}

func DishHandler(w http.ResponseWriter, r *http.Request) {
	dishID := mux.Vars(r)["id"]
	var dish models.Dish
	if err := migrations.DB.Where("id = ?", dishID).First(&dish).Error; err != nil {
		log.Println("dishID is uncorrect")
		http.Error(w, "dishID is uncorrect", http.StatusBadRequest)
		return
	}
	utils.JSONFormat(w, r, dish)
}
