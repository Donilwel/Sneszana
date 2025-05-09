package handlers

import (
	"Sneszana/database/migrations"
	"Sneszana/logging"
	"Sneszana/models"
	"Sneszana/utils"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"
	"log"
	"net/http"
	"time"
)

func ShowCookingOrdersHandler(w http.ResponseWriter, r *http.Request) {
	var orders []models.Order
	if err := migrations.DB.Preload("OrderItems").Where("status = ?", models.COOKING).Find(&orders).Error; err != nil {
		log.Println("error, nothing to cooking")
		http.Error(w, "error, nothing to cooking", http.StatusInternalServerError)
		return
	}
	log.Println("successfully show cooking orders")
	utils.JSONFormat(w, r, orders)
}

func ChangeStaffStatusOrderHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)
	params := mux.Vars(r)
	orderID := params["id"]

	if _, err := uuid.Parse(orderID); err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, err, startTime, "Invalid order ID format")
		http.Error(w, "Invalid order ID format", http.StatusBadRequest)
		return
	}

	tx := migrations.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var order models.Order
	if err := tx.Where("id = ?", orderID).First(&order).Error; err != nil {
		tx.Rollback()
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "Order not found")
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	if order.Status != models.COOKING {
		tx.Rollback()
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusConflict, nil, startTime, "Order status is not 'cooking'")
		http.Error(w, "Order status is not 'cooking', nothing to change", http.StatusConflict)
		return
	}

	status := r.URL.Query().Get("status")
	switch status {
	case models.CANCELED:
		order.Status = models.CANCELED
	case models.WAITFREECOURIER:
		order.Status = models.WAITFREECOURIER
	default:
		tx.Rollback()
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, nil, startTime, "Invalid status provided")
		http.Error(w, "Invalid status", http.StatusBadRequest)
		return
	}

	if err := tx.Save(&order).Error; err != nil {
		tx.Rollback()
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Error saving order status change")
		http.Error(w, "Error saving order status change", http.StatusInternalServerError)
		return
	}

	tx.Commit()
	utils.JSONFormat(w, r, order)
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Order status updated successfully")
}
