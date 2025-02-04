package handlers

import (
	"Sneszana/database/migrations"
	"Sneszana/logging"
	"Sneszana/models"
	"Sneszana/utils"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"
	"net/http"
	"strconv"
	"time"
)

func ShowAllCouriersHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)
	status := r.URL.Query().Get("status")

	var couriers []models.Courier

	if status == "" {
		if err := migrations.DB.Preload("User").Find(&couriers).Error; err != nil {
			logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Error fetching all couriers")
			http.Error(w, "Error fetching couriers", http.StatusInternalServerError)
			return
		}
	} else {
		if status != models.ACTIVE && status != models.UNACTIVE && status != models.WAITING {
			logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, nil, startTime, "Unknown status filter")
			http.Error(w, "Unknown status", http.StatusBadRequest)
			return
		}

		if err := migrations.DB.Where("status = ?", status).Find(&couriers).Error; err != nil {
			logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Error fetching couriers with status")
			http.Error(w, "Error fetching couriers with status: "+status, http.StatusInternalServerError)
			return
		}
	}
	if len(couriers) == 0 {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, nil, startTime, "No couriers found")
		http.Error(w, "No couriers found", http.StatusNotFound)
		return
	}
	utils.JSONFormat(w, r, couriers)
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Couriers retrieved successfully")
}

func ShowAllUsersHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now() // Start tracking execution time
	userID, _ := r.Context().Value("userID").(uuid.UUID)
	var users []models.User

	if err := migrations.DB.Find(&users).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Error fetching users")
		http.Error(w, "Error fetching users", http.StatusInternalServerError)
		return
	}

	if len(users) == 0 {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, nil, startTime, "No users found in the database")
		http.Error(w, "No users found", http.StatusNotFound)
		return
	}

	utils.JSONFormat(w, r, users)
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Users retrieved successfully")
}

func ShowAllDishesHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)

	var dishes []models.Dish

	if err := migrations.DB.Find(&dishes).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Error fetching dishes")
		http.Error(w, "Error fetching dishes", http.StatusInternalServerError)
		return
	}

	utils.JSONFormat(w, r, dishes)
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Dishes fetched successfully")
}

func ShowCourierHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)
	requestID := mux.Vars(r)["id"]

	id, err := uuid.Parse(requestID)
	if err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, err, startTime, "Error converting ID to UUID")
		http.Error(w, "Error converting ID to UUID", http.StatusBadRequest)
		return
	}

	var courier models.Courier

	if err := migrations.DB.Where("id = ?", id).First(&courier).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Error fetching courier")
		http.Error(w, "Error fetching courier", http.StatusInternalServerError)
		return
	}

	utils.JSONFormat(w, r, courier)
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Courier retrieved successfully")
}

func SetRolesHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)
	params := mux.Vars(r)
	username := params["username"]

	tx := migrations.DB.Begin()
	defer tx.Rollback()

	var user models.User
	if err := tx.Where("name = ?", username).First(&user).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, err, startTime, "User does not exist")
		http.Error(w, "User does not exist", http.StatusBadRequest)
		return
	}

	role := r.URL.Query().Get("role")
	if role == "" {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, nil, startTime, "Role is required")
		http.Error(w, "Role is required", http.StatusBadRequest)
		return
	}

	if user.Role == role {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, nil, startTime, "User already has this role")
		http.Error(w, "User already has the role "+role, http.StatusBadRequest)
		return
	}

	if user.Role == models.COURIER_ROLE && (role == models.CUSTOMER_ROLE || role == models.ADMIN_ROLE || role == models.STAFF_ROLE) {
		var courier models.Courier
		if err := tx.Where("user_id = ?", user.ID).First(&courier).Error; err != nil {
			logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusBadRequest, err, startTime, "Error fetching courier user")
			http.Error(w, "Error fetching courier user", http.StatusBadRequest)
			return
		}
		if err := tx.Unscoped().Delete(&courier).Error; err != nil {
			logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusBadRequest, err, startTime, "Error deleting courier user")
			http.Error(w, "Error deleting courier user", http.StatusBadRequest)
			return
		}
		logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Courier user deleted")
	}

	switch role {
	case models.ADMIN_ROLE:
		user.Role = models.ADMIN_ROLE
	case models.CUSTOMER_ROLE:
		user.Role = models.CUSTOMER_ROLE
	case models.STAFF_ROLE:
		user.Role = models.STAFF_ROLE
	case models.COURIER_ROLE:
		if err := tx.Create(&models.Courier{UserID: user.ID}).Error; err != nil {
			logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Error creating courier record")
			http.Error(w, "Error creating courier record", http.StatusInternalServerError)
			return
		}
		user.Role = models.COURIER_ROLE
	default:
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, nil, startTime, "Role does not exist")
		http.Error(w, "Role does not exist", http.StatusBadRequest)
		return
	}

	if err := tx.Save(&user).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusBadRequest, err, startTime, "User role update failed")
		http.Error(w, "User role update failed", http.StatusBadRequest)
		return
	}

	tx.Commit()
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("User role updated successfully"))
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "User role updated successfully")
}

func ChangePriceHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)
	requestID := mux.Vars(r)["id"]

	id, err := uuid.Parse(requestID)
	if err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, err, startTime, "Error converting ID to UUID")
		http.Error(w, "Error converting ID to UUID", http.StatusBadRequest)
		return
	}

	price := r.URL.Query().Get("price")
	newPrice, err := strconv.ParseFloat(price, 64)
	if err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, err, startTime, "Error converting price to float")
		http.Error(w, "Error converting price to float", http.StatusBadRequest)
		return
	}

	tx := migrations.DB.Begin()
	defer tx.Rollback()

	var dish models.Dish
	if err := tx.Raw("SELECT * FROM dishes WHERE id = ? FOR UPDATE", id).Scan(&dish).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Error fetching dish")
		http.Error(w, "Error fetching dish", http.StatusInternalServerError)
		return
	}

	dish.Price = newPrice

	if err := tx.Save(&dish).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Error updating dish price")
		http.Error(w, "Error updating dish price", http.StatusInternalServerError)
		return
	}

	tx.Commit()
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Dish price updated successfully"))
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Dish price updated successfully")
}

func ChangeReviewsStatusHandler(w http.ResponseWriter, r *http.Request) {

}

func DeleteDishesHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)
	dishID := r.URL.Query().Get("id")

	if _, err := uuid.Parse(dishID); err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, err, startTime, "Invalid dish ID format")
		http.Error(w, "Invalid dish ID format", http.StatusBadRequest)
		return
	}

	tx := migrations.DB.Begin()
	defer tx.Rollback()

	if err := tx.Exec("DELETE FROM dishes WHERE id = ?", dishID).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Error deleting dish")
		http.Error(w, "Error deleting dish", http.StatusInternalServerError)
		return
	}

	tx.Commit()
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Dish deleted successfully"))
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Dish deleted successfully")
}
