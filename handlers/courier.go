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

var Accepted uint

//func ShowStatusCourierHandler(w http.ResponseWriter, r *http.Request) {
//	userID, ok := r.Context().Value("userID").(uint) // Приведение типа
//	if !ok {
//		http.Error(w, "Invalid user ID", http.StatusUnauthorized)
//		return
//	}
//	var courier models.Courier
//	if err := migrations.DB.Where("user_id = ?", userID).First(&courier).Error; err != nil {
//		log.Println("Courier not found")
//		http.Error(w, "Courier not found", http.StatusNotFound)
//		return
//	}
//	log.Println("Current courier status showed successfully")
//	utils.JSONFormat(w, r, courier.Status)
//}

func ShowCourierInformationHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		http.Error(w, "Invalid user ID", http.StatusUnauthorized)
		return
	}
	check := r.URL.Query().Get("check")
	var courier models.Courier
	if err := migrations.DB.Preload("User").Where("user_id = ?", userID).First(&courier).Error; err != nil {
		log.Println("Courier not found")
		http.Error(w, "Courier not found", http.StatusNotFound)
		return
	}
	if check == "" {
		log.Println("Current courier showed successfully")
		utils.JSONFormat(w, r, courier)
	} else {
		shower := ""
		switch check {
		case "name":
			shower = courier.User.Name
		case "rating":
			shower = strconv.FormatFloat(courier.Rating, 'f', 2, 64)
		case "status":
			shower = courier.Status
		case "ordersCount":
			shower = strconv.Itoa(courier.OrdersCount)
		case "id":
			shower = courier.ID.String()
		case "email":
			shower = courier.User.Email
		case "phone":
			shower = courier.User.PhoneNumber
		default:
			log.Println("Unknown check courier information")
			http.Error(w, "Unknown check courier information, use name, rating, status, ordersCount, id, email, phone", http.StatusBadRequest)
			return
		}
		utils.JSONFormat(w, r, shower)
	}
}

func SetStatusCourierHandler(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	userID, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		log.Println("Invalid user ID", http.StatusUnauthorized)
		http.Error(w, "Invalid user ID", http.StatusUnauthorized)
		return
	}
	var courier models.Courier
	if err := migrations.DB.Preload("User").Where("user_id = ?", userID).First(&courier).Error; err != nil {
		log.Println("Courier not found")
		http.Error(w, "Courier not found", http.StatusNotFound)
		return
	}
	//if courier.Status == models.ACTIVE && status != models.ACTIVE {
	//	//тут потом дописать надо логику счетчика заказов чтобы курьер не крутил
	//	// скорее всего просто покупатель будет отмечать что заказ получен и глобальная переменная будет
	//	// изменяться на 2 и тогда счетчик будет готов
	//
	//	Accepted = 1
	//}
	if status == courier.Status {
		log.Println("Courier status is already setted")
		http.Error(w, "Courier status is already setted", http.StatusBadRequest)
		return
	}
	switch status {
	case models.ACTIVE:
		courier.Status = models.ACTIVE
	case models.UNACTIVE:
		courier.Status = models.UNACTIVE
	case models.WAITING:
		courier.Status = models.WAITING
	default:
		log.Println("Invalid status")
		http.Error(w, "Invalid status", http.StatusBadRequest)
		return
	}
	if err := migrations.DB.Save(&courier).Error; err != nil {
		log.Println("Courier save failed")
		http.Error(w, "Courier save failed", http.StatusInternalServerError)
		return
	}
	log.Printf("Courier status on %s successfully changed", status)
	log.Println("Current courier set status successfully")
	w.WriteHeader(http.StatusOK)
	utils.JSONFormat(w, r, map[string]interface{}{
		"username": courier.User.Name,
		"status":   courier.Status,
	})
}

func GetActuallOrdersHandler(w http.ResponseWriter, r *http.Request) {

	var orders []models.Order
	if err := migrations.DB.Where("status = ?", models.WAITFREECOURIER).Find(&orders).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	utils.JSONFormat(w, r, orders)
}

func SetCourierOnOrderHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		log.Println("invalid or missing userID", http.StatusUnauthorized)
		http.Error(w, "invalid or missing userID", http.StatusUnauthorized)
		return
	}

	orderID := mux.Vars(r)["orderID"]

	tx := migrations.DB.Begin()
	defer tx.Rollback()

	if tx.Error != nil {
		log.Println("error, failed to start transaction")
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	var courier models.Courier
	if err := tx.Where("User_id = ?", userID).First(&courier).Error; err != nil {
		log.Println("courier not found")
		http.Error(w, "courier not found", http.StatusNotFound)
		return
	}

	var order models.Order
	if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("id = ?", orderID).First(&order).Error; err != nil {
		log.Println("order not found")
		http.Error(w, "order not found", http.StatusNotFound)
		return
	}

	if order.Status != models.WAITFREECOURIER {
		log.Println("order is already taken")
		http.Error(w, "order is already taken", http.StatusConflict)
		return
	}

	if courier.Status != models.WAITING {
		log.Println("courier status is not available")
		http.Error(w, "courier status is not available. Need courier status = waiting", http.StatusConflict)
		return
	}

	order.Status = models.ONTHEWAY
	order.CourierID = courier.ID
	courier.Status = models.ACTIVE

	if err := tx.Save(&order).Error; err != nil {
		log.Println("order save failed")
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	if err := tx.Save(&courier).Error; err != nil {
		log.Println("courier save failed")
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit().Error; err != nil {
		log.Println("transaction commit failed")
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	utils.JSONFormat(w, r, order)
}
