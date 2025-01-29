package handlers

import (
	"Sneszana/database/migrations"
	"Sneszana/models"
	"Sneszana/utils"
	"github.com/gorilla/mux"
	"log"
	"net/http"
	"strconv"
)

func ShowAllCouriersHandler(w http.ResponseWriter, r *http.Request) {
	var couriers []models.Courier
	status := r.URL.Query().Get("status")

	if status == "" {
		if err := migrations.DB.Preload("User").Find(&couriers).Error; err != nil {
			log.Println("error fetching couriers:", err)
			http.Error(w, "error fetching couriers", http.StatusInternalServerError)
			return
		}
	} else {
		if status != models.ACTIVE && status != models.UNACTIVE && status != models.WAITING {
			log.Println("unknown status: ", status)
			http.Error(w, "unknown status", http.StatusBadRequest)
			return
		}
		if err := migrations.DB.Where("status = ?", status).Find(&couriers).Error; err != nil {
			log.Printf("error fetching couriers with status: %s", status)
			http.Error(w, "error fetching couriers with status: "+status, http.StatusInternalServerError)
			return
		}
	}

	if len(couriers) == 0 {
		log.Println("not found user with role courier")
		http.Error(w, "not found user", http.StatusNotFound)
		return
	}
	utils.JSONFormat(w, r, couriers)
	log.Println("users with role courier show successfully")
}

func SetRolesHandler(w http.ResponseWriter, r *http.Request) {
	var user models.User
	params := mux.Vars(r)
	username := params["username"]

	tx := migrations.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Where("name = ?", username).First(&user).Error; err != nil {
		log.Println("user not exist")
		http.Error(w, "user not exist", http.StatusBadRequest)
		tx.Rollback()
		return
	}

	role := r.URL.Query().Get("role")
	if role == "" {
		log.Println("role is required")
		http.Error(w, "role is required", http.StatusBadRequest)
		tx.Rollback()
		return
	}
	if user.Role == role {
		log.Printf("user with role %s already has the role %s", username, role)
		http.Error(w, "role already has the role "+role, http.StatusBadRequest)
		tx.Rollback()
		return
	}
	if user.Role == models.COURIER_ROLE && (role == models.CUSTOMER_ROLE || role == models.ADMIN_ROLE) {
		var courier models.Courier
		if err := tx.Where("user_id = ?", user.ID).First(&courier).Error; err != nil {
			log.Println("error getting courier user")
			http.Error(w, "error getting courier user", http.StatusBadRequest)
			tx.Rollback()
			return
		}
		if err := tx.Unscoped().Delete(&courier).Error; err != nil {
			log.Println("error deleting courier user")
			http.Error(w, "error deleting courier user", http.StatusBadRequest)
			tx.Rollback()
			return
		}
		log.Println("courier user is deleted")
	}

	switch role {
	case models.ADMIN_ROLE:
		user.Role = models.ADMIN_ROLE
		log.Println("user role now ADMIN_ROLE")

	case models.CUSTOMER_ROLE:
		user.Role = models.CUSTOMER_ROLE
		log.Println("user role now CUSTOMER_ROLE")

	case models.COURIER_ROLE:
		log.Printf("Creating courier for user: %+v", user)
		if err := tx.Create(&models.Courier{UserID: user.ID}).Error; err != nil {

			log.Println("error creating courier record")
			http.Error(w, "error creating courier record", http.StatusInternalServerError)
			tx.Rollback()
			return
		}
		log.Println("courier database is created")
		user.Role = models.COURIER_ROLE
		log.Println("user role now COURIER_ROLE")

	default:
		log.Println("role not exist")
		http.Error(w, "role not exist", http.StatusBadRequest)
		tx.Rollback()
		return
	}

	if err := tx.Save(&user).Error; err != nil {
		log.Println("error, user role not uploaded in database")
		http.Error(w, "user not uploaded in database", http.StatusBadRequest)
		tx.Rollback()
		return
	}

	tx.Commit()
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("user role updated successfully"))
}

func ShowCourierHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, err := strconv.Atoi(params["id"])
	if err != nil {
		log.Println("error converting id to int")
		http.Error(w, "error converting id to int", http.StatusBadRequest)
		return
	}
	var courier models.Courier
	if err := migrations.DB.Where("id = ?", id).First(&courier).Error; err != nil {
		log.Println("error fetching courier")
		http.Error(w, "error fetching courier", http.StatusInternalServerError)
		return
	}
	utils.JSONFormat(w, r, courier)
	log.Println("courier", courier.ID)
}
