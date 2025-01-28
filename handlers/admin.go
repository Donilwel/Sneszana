package handlers

import (
	"Sneszana/database/migrations"
	"Sneszana/models"
	"github.com/gorilla/mux"
	"log"
	"net/http"
	"strconv"
)

func ShowAllCouriersHandler(w http.ResponseWriter, r *http.Request) {
}

func SetRolesHandler(w http.ResponseWriter, r *http.Request) {
	var user models.User
	params := mux.Vars(r)

	username, err := strconv.Atoi(params["username"])
	if err != nil {
		log.Println("username uncorrect or not exist")
		http.Error(w, "username uncorrect or not exist", http.StatusBadRequest)
		return
	}
	role := r.URL.Query().Get("role")
	if err := migrations.DB.Where("username = ?", username).First(&user).Error; err != nil {
		log.Println("user not exist")
		http.Error(w, "user not exist", http.StatusBadRequest)
		return
	}
	switch role {
	case "ADMIN_ROLE":
		if user.Role == "ADMIN_ROLE" {
			log.Println("error change, user already has ADMIN_ROLE")
			http.Error(w, "user already has ADMIN_ROLE", http.StatusBadRequest)
			return
		}
		user.Role = "ADMIN_ROLE"
		log.Println("user role now ADMIN_ROLE")
	case "CUSTOM_ROLE":
		if user.Role == "CUSTOM_ROLE" {
			log.Println("error change, user already has CUSTOM_ROLE")
			http.Error(w, "user already has CUSTOM_ROLE", http.StatusBadRequest)
			return
		}
		user.Role = "CUSTOM_ROLE"
		log.Println("user role now CUSTOM_ROLE")
	case "COURIER_ROLE":
		if user.Role == "COURIER_ROLE" {
			log.Println("error change, user already has COURIER_ROLE")
			http.Error(w, "user already has COURIER_ROLE", http.StatusBadRequest)
			return
		}
		user.Role = "COURIER_ROLE"
		log.Println("user role now COURIER_ROLE")
	default:
		log.Println("role not exist")
		http.Error(w, "role not exist", http.StatusBadRequest)
		return
	}
	if err := migrations.DB.Save(&user).Error; err != nil {
		log.Println("error, user role not uploaded in database")
		http.Error(w, "user not uploaded in database", http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func ShowCourierHandler(w http.ResponseWriter, r *http.Request) {

}
