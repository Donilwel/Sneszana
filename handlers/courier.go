package handlers

import (
	"Sneszana/database/migrations"
	"Sneszana/models"
	"Sneszana/utils"
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
	userID, ok := r.Context().Value("userID").(uint)
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
			shower = strconv.Itoa(int(courier.ID))
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
	userID, ok := r.Context().Value("userID").(uint)
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
