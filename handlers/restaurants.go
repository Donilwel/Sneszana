package handlers

import (
	"Sneszana/models"
	"github.com/gorilla/mux"
	"net/http"
	"strconv"
)

func RestaurantsMenuHandler(w http.ResponseWriter, r *http.Request) {

	params := mux.Vars(r)["id"]
	restaurantID, err := strconv.Atoi(params)
	if err != nil {
		http.Error(w, "wrong ID restaurant", http.StatusBadRequest)
		return
	}

	var restaurants []models.Restaurant

}
