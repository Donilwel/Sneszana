package handlers

import (
	"Sneszana/database/migrations"
	"Sneszana/models"
	"Sneszana/utils"
	"github.com/google/uuid"
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
	defer tx.Rollback()

	if err := tx.Where("name = ?", username).First(&user).Error; err != nil {
		log.Println("user not exist")
		http.Error(w, "user not exist", http.StatusBadRequest)
		return
	}

	role := r.URL.Query().Get("role")
	if role == "" {
		log.Println("role is required")
		http.Error(w, "role is required", http.StatusBadRequest)
		return
	}
	if user.Role == role {
		log.Printf("user with role %s already has the role %s", username, role)
		http.Error(w, "role already has the role "+role, http.StatusBadRequest)
		return
	}
	if user.Role == models.COURIER_ROLE && (role == models.CUSTOMER_ROLE || role == models.ADMIN_ROLE || role == models.STAFF_ROLE) {
		var courier models.Courier
		if err := tx.Where("user_id = ?", user.ID).First(&courier).Error; err != nil {
			log.Println("error getting courier user")
			http.Error(w, "error getting courier user", http.StatusBadRequest)
			return
		}
		if err := tx.Unscoped().Delete(&courier).Error; err != nil {
			log.Println("error deleting courier user")
			http.Error(w, "error deleting courier user", http.StatusBadRequest)
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
	case models.STAFF_ROLE:
		user.Role = models.STAFF_ROLE
		log.Println("user role now STAFF_ROLE")
	case models.COURIER_ROLE:
		log.Printf("Creating courier for user: %+v", user)
		if err := tx.Create(&models.Courier{UserID: user.ID}).Error; err != nil {

			log.Println("error creating courier record")
			http.Error(w, "error creating courier record", http.StatusInternalServerError)
			return
		}
		log.Println("courier database is created")
		user.Role = models.COURIER_ROLE
		log.Println("user role now COURIER_ROLE")

	default:
		log.Println("role not exist")
		http.Error(w, "role not exist", http.StatusBadRequest)
		return
	}

	if err := tx.Save(&user).Error; err != nil {
		log.Println("error, user role not uploaded in database")
		http.Error(w, "user not uploaded in database", http.StatusBadRequest)
		return
	}

	tx.Commit()
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("user role updated successfully"))
}

func ShowCourierHandler(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(mux.Vars(r)["id"])
	if err != nil {
		log.Println("error converting id to UUID")
		http.Error(w, "error converting id to UUID", http.StatusBadRequest)
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

func DeleteDishesHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	tx := migrations.DB.Begin()
	if err := tx.Exec("DELETE FROM dishes WHERE id = ?", id).Error; err != nil {
		log.Println("error deleting dishes")
		http.Error(w, "error deleting dishes", http.StatusInternalServerError)
		return
	}
	tx.Commit()
	log.Println("dishes deleted successfully")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("dishes deleted successfully"))
}

func ChangePriceHandler(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(mux.Vars(r)["id"])
	if err != nil {
		log.Println("error converting id to UUID")
		http.Error(w, "error converting id to UUID", http.StatusBadRequest)
		return
	}

	price := r.URL.Query().Get("price")
	newPrice, err := strconv.ParseFloat(price, 64)
	if err != nil {
		log.Println("error converting price to float")
		http.Error(w, "error converting price to float", http.StatusBadRequest)
		return
	}

	tx := migrations.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var dish models.Dish
	if err := tx.Raw("SELECT * FROM dishes WHERE id = ? FOR UPDATE", id).Scan(&dish).Error; err != nil {
		log.Println("error fetching dish")
		tx.Rollback()
		http.Error(w, "error fetching dish", http.StatusInternalServerError)
		return
	}

	dish.Price = newPrice

	if err := tx.Save(&dish).Error; err != nil {
		log.Println("error, dish not updated")
		tx.Rollback()
		http.Error(w, "error dish not updated", http.StatusInternalServerError)
		return
	}

	tx.Commit()
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("dish price updated successfully"))
}

func ShowAllDishesHandler(w http.ResponseWriter, r *http.Request) {
	var dishes []models.Dish
	if err := migrations.DB.Find(&dishes).Error; err != nil {
		log.Println("error fetching dishes")
		http.Error(w, "error fetching dishes", http.StatusInternalServerError)
		return
	}
	utils.JSONFormat(w, r, dishes)
	log.Println("dishes fetched successfully")
}

func ShowReviewsStatusHandler(w http.ResponseWriter, r *http.Request) {
	var reviews []models.Review
	if err := migrations.DB.Where("status = ?", models.CHECK).Find(&reviews).Error; err != nil {
		log.Println("error fetching reviews")
		http.Error(w, "error fetching reviews", http.StatusInternalServerError)
		return
	}
	utils.JSONFormat(w, r, reviews)
}
func ChangeReviewsStatusHandler(w http.ResponseWriter, r *http.Request) {

}
