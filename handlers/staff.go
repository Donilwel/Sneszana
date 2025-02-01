package handlers

import (
	"Sneszana/database/migrations"
	"Sneszana/models"
	"Sneszana/utils"
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

func ShowCookingOrdersHandler(w http.ResponseWriter, r *http.Request) {
	var orders []models.Order
	if err := migrations.DB.Where("status = ?", models.COOKING).Find(&orders).Error; err != nil {
		log.Println("error, nothing to cooking")
		http.Error(w, "error, nothing to cooking", http.StatusInternalServerError)
		return
	}
	log.Println("successfully show cooking orders")
	utils.JSONFormat(w, r, orders)
}
func ChangeStaffStatusOrderHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	orderId := params["id"]
	var order models.Order

	tx := migrations.DB.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()
	if err := tx.Where("id = ?", orderId).First(&order).Error; err != nil {
		tx.Rollback()
		log.Println("error, nothing to cooking")
		http.Error(w, "error, nothing to cooking", http.StatusInternalServerError)
		return
	}
	if order.Status != models.COOKING {
		tx.Rollback()
		log.Println("error, order status is not a cooking, nothing to change")
		http.Error(w, "error, order status is not a cooking, nothing to change", http.StatusInternalServerError)
		return
	}
	status := r.URL.Query().Get("status")
	switch status {
	case models.CANCELED:
		order.Status = models.CANCELED
	case models.WAITFREECOURIER:
		order.Status = models.WAITFREECOURIER
	default:
		log.Println("error, invalid status")
		tx.Rollback()
		http.Error(w, "error, invalid status", http.StatusInternalServerError)
		return
	}
	if err := tx.Save(&order).Error; err != nil {
		tx.Rollback()
		log.Println("error to save changes in database")
		http.Error(w, "error to save changes in database", http.StatusInternalServerError)
		return
	}

	tx.Commit()
	utils.JSONFormat(w, r, order)
}
