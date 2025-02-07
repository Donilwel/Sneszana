package handlers

import (
	"Sneszana/config"
	"Sneszana/database/migrations"
	"Sneszana/logging"
	"Sneszana/models"
	"Sneszana/utils"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"
	"net/http"
	"time"
)

func RestaurantsMenuHandler(w http.ResponseWriter, r *http.Request) {
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

// кусок кода который будет использоваться только когда будет 2 ресторан
//restaurantID := r.URL.Query().Get("id")

//if restaurantID != "" {
//	var restaurants models.Restaurant
//	if err := migrations.DB.Where("id = ?", restaurantID).First(&restaurants).Error; err != nil {
//		log.Println("restaurantID is uncorrect")
//		http.Error(w, "restaurantID is uncorrect", http.StatusBadRequest)
//		return
//	}
//	if err := migrations.DB.Where("restaurant_id = ?", restaurantID).Find(&dishes).Error; err != nil {
//		log.Println("not have menu for this restaurantID")
//		http.Error(w, "restaurantID is empty", http.StatusNotFound)
//		return
//	}
//} else {

func DishHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)

	dishID := mux.Vars(r)["id"]
	if _, err := uuid.Parse(dishID); err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, err, startTime, "Invalid dish ID format")
		http.Error(w, "Invalid dish ID format", http.StatusBadRequest)
		return
	}

	var dish models.Dish
	if err := migrations.DB.Where("id = ?", dishID).First(&dish).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "Dish not found")
		http.Error(w, "Dish not found", http.StatusNotFound)
		return
	}

	utils.JSONFormat(w, r, dish)
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Dish retrieved successfully")
}
