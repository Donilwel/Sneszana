package handlers

import (
	"Sneszana/config"
	"Sneszana/database/migrations"
	"Sneszana/logging"
	"Sneszana/models"
	"Sneszana/utils"
	"encoding/json"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"
	"net/http"
	"time"
)

func ShowAllCouriersHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)
	status := r.URL.Query().Get("status")
	ctx := r.Context()

	var couriers []models.Courier
	cacheKey := "couriers:all"
	if status != "" {
		cacheKey = "couriers:" + status
	}

	fromCache, err := utils.GetOrSetTCache(ctx, config.Rdb, migrations.DB.WithContext(ctx), cacheKey, migrations.DB.WithContext(ctx).Preload("User"), &couriers, 5*time.Minute)
	if err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Error fetching couriers")
		http.Error(w, "Error fetching couriers", http.StatusInternalServerError)
		return
	}

	if len(couriers) == 0 {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, nil, startTime, "No couriers found")
		http.Error(w, "No couriers found", http.StatusNotFound)
		return
	}
	data := "database"
	if fromCache {
		data = "cache"
	}
	utils.JSONFormat(w, r, couriers)
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Couriers retrieved successfully from "+data)
}

func ShowAllUsersHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)
	ctx := r.Context()

	var users []models.User
	cacheKey := "users:all"
	fromCache, err := utils.GetOrSetTCache(ctx, config.Rdb, migrations.DB, cacheKey, migrations.DB, &users, 5*time.Minute)
	if err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Error fetching users")
		http.Error(w, "Error fetching users", http.StatusInternalServerError)
		return
	}

	if len(users) == 0 {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, nil, startTime, "No users found")
		http.Error(w, "No users found", http.StatusNotFound)
		return
	}
	data := "database"
	if fromCache {
		data = "cache"
	}
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Users retrieved successfully from "+data)
	utils.JSONFormat(w, r, users)
}

func ShowAllDishesHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)
	ctx := r.Context()

	var dishes []models.Dish
	cacheKey := "dishes:all"

	fromCache, err := utils.GetOrSetTCache(ctx, config.Rdb, migrations.DB, cacheKey, migrations.DB, &dishes, 5*time.Minute)
	if err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Error fetching dishes")
		http.Error(w, "Error fetching dishes", http.StatusInternalServerError)
		return
	}

	if len(dishes) == 0 {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, nil, startTime, "No dishes found")
		http.Error(w, "No dishes found", http.StatusNotFound)
		return
	}

	source := "database"
	if fromCache {
		source = "cache"
	}
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Dishes retrieved successfully from "+source)
	utils.JSONFormat(w, r, dishes)
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
		http.Error(w, "Invalid dish ID", http.StatusBadRequest)
		return
	}

	// Читаем тело запроса
	var requestBody struct {
		Price float64 `json:"price"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, err, startTime, "Invalid request body")
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if requestBody.Price <= 0 {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, nil, startTime, "Price must be positive")
		http.Error(w, "Price must be positive", http.StatusBadRequest)
		return
	}

	tx := migrations.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
	}()

	var dish models.Dish
	if err := tx.First(&dish, "id = ?", id).Error; err != nil {
		tx.Rollback()
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusNotFound, err, startTime, "Dish not found")
		http.Error(w, "Dish not found", http.StatusNotFound)
		return
	}

	if err := tx.Model(&dish).Update("price", requestBody.Price).Error; err != nil {
		tx.Rollback()
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Error updating dish price")
		http.Error(w, "Error updating dish price", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Transaction commit failed")
		http.Error(w, "Transaction commit failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Dish price updated successfully"))
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Dish price updated successfully")
}

func DeleteDishesHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)
	dishID := mux.Vars(r)["id"]

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
