package handlers

import (
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

const (
	CHECK  string = "checking"
	ACCEPT string = "accept"
)

func ShowReviewsStatusHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)

	status := r.URL.Query().Get("status")

	var reviews []models.Review
	query := migrations.DB

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Find(&reviews).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to fetch reviews")
		http.Error(w, "Failed to fetch reviews", http.StatusInternalServerError)
		return
	}

	if len(reviews) == 0 {
		logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusNotFound, nil, startTime, "No reviews found")
		http.Error(w, "No reviews found", http.StatusNotFound)
		return
	}

	type ReviewResponse struct {
		ID          uuid.UUID `json:"id"`
		UserName    string    `json:"user_name"`
		DishName    string    `json:"dish_name"`
		TextMessage string    `json:"text_message"`
		Mark        uint      `json:"mark"`
		Status      string    `json:"status"`
		CreatedAt   time.Time `json:"created_at"`
	}

	var response []ReviewResponse
	for _, review := range reviews {
		var user models.User
		var dish models.Dish

		if err := migrations.DB.First(&user, "id = ?", review.UserID).Error; err != nil {
			logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "User not found")
			continue
		}

		if err := migrations.DB.First(&dish, "id = ?", review.DishID).Error; err != nil {
			logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "Dish not found")
			continue
		}

		response = append(response, ReviewResponse{
			ID:          review.ID,
			UserName:    user.Name,
			DishName:    dish.Name,
			TextMessage: review.TextMessage,
			Mark:        review.Mark,
			Status:      review.Status,
		})
	}

	utils.JSONFormat(w, r, response)
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Reviews retrieved successfully")
}

func ShowReviewsDishByIDHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)

	vars := mux.Vars(r)
	dishID, err := uuid.Parse(vars["id"])
	if err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, err, startTime, "Invalid dish ID format")
		http.Error(w, "Invalid dish ID format", http.StatusBadRequest)
		return
	}

	var reviews []models.Review
	if err := migrations.DB.Where("dish_id = ? AND status = ?", dishID, ACCEPT).Find(&reviews).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to fetch reviews for dish")
		http.Error(w, "Failed to fetch reviews for dish", http.StatusInternalServerError)
		return
	}

	type ReviewResponse struct {
		ID          uuid.UUID `json:"id"`
		UserName    string    `json:"user_name"`
		TextMessage string    `json:"text_message"`
		Mark        uint      `json:"mark"`
		CreatedAt   time.Time `json:"created_at"`
	}

	var response []ReviewResponse
	for _, review := range reviews {
		var user models.User
		if err := migrations.DB.First(&user, "id = ?", review.UserID).Error; err != nil {
			logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "User not found")
			continue
		}

		response = append(response, ReviewResponse{
			ID:          review.ID,
			UserName:    user.Name,
			TextMessage: review.TextMessage,
			Mark:        review.Mark,
		})
	}

	utils.JSONFormat(w, r, response)
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Dish reviews retrieved successfully")
}

// ChangeReviewsStatusHandler изменяет статус отзыва
func ChangeReviewsStatusHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)

	vars := mux.Vars(r)
	reviewID, err := uuid.Parse(vars["id"])
	if err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, err, startTime, "Invalid review ID format")
		http.Error(w, "Invalid review ID format", http.StatusBadRequest)
		return
	}

	var request struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, err, startTime, "Invalid request body")
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if request.Status != CHECK && request.Status != ACCEPT {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, nil, startTime, "Invalid status value")
		http.Error(w, "Status must be either 'checking' or 'accept'", http.StatusBadRequest)
		return
	}

	tx := migrations.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var review models.Review
	if err := tx.First(&review, "id = ?", reviewID).Error; err != nil {
		tx.Rollback()
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusNotFound, err, startTime, "Review not found")
		http.Error(w, "Review not found", http.StatusNotFound)
		return
	}

	if err := tx.Model(&review).Update("status", request.Status).Error; err != nil {
		tx.Rollback()
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to update review status")
		http.Error(w, "Failed to update review status", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit().Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Transaction commit failed")
		http.Error(w, "Failed to update review status", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Review status updated successfully"))
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Review status updated successfully")
}
