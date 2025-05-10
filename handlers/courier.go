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
	"strconv"
	"time"
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
	startTime := time.Now()
	userID, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusUnauthorized, nil, startTime, "Invalid user ID")
		http.Error(w, "Invalid user ID", http.StatusUnauthorized)
		return
	}
	check := r.URL.Query().Get("check")
	var courier models.Courier
	if err := migrations.DB.Preload("User").Where("user_id = ?", userID).First(&courier).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "Courier not found")
		http.Error(w, "Courier not found", http.StatusNotFound)
		return
	}
	if check == "" {
		logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Current courier showed successfully")
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
			logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, nil, startTime, "Unknown check courier information")
			http.Error(w, "Unknown check courier information, use name, rating, status, ordersCount, id, email, phone", http.StatusBadRequest)
			return
		}
		logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Current courier showed successfully")
		utils.JSONFormat(w, r, shower)
	}
}

func GetActuallOrdersHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusUnauthorized, nil, startTime, "Invalid user ID in request context")
		http.Error(w, "Invalid user ID", http.StatusUnauthorized)
		return
	}

	// 1. Получаем заказы с OrderItems
	var orders []models.Order
	if err := migrations.DB.
		Preload("OrderItems").
		Where("status = ?", models.WAITFREECOURIER).
		Find(&orders).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Database error while fetching orders")
		http.Error(w, "Error fetching orders", http.StatusInternalServerError)
		return
	}

	if len(orders) == 0 {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, nil, startTime, "No available orders found")
		http.Error(w, "No available orders", http.StatusNotFound)
		return
	}

	// 2. Собираем все ID блюд из всех заказов
	var dishIDs []uuid.UUID
	for _, order := range orders {
		for _, item := range order.OrderItems {
			dishIDs = append(dishIDs, item.DishID)
		}
	}

	// 3. Получаем информацию о блюдах
	var dishes []models.Dish
	if len(dishIDs) > 0 {
		if err := migrations.DB.Where("id IN ?", dishIDs).Find(&dishes).Error; err != nil {
			logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Database error while fetching dishes")
			http.Error(w, "Error fetching dishes", http.StatusInternalServerError)
			return
		}
	}

	// 4. Создаем map для быстрого доступа к блюдам по ID
	dishMap := make(map[uuid.UUID]models.Dish)
	for _, dish := range dishes {
		dishMap[dish.ID] = dish
	}

	// 5. Получаем адреса для всех заказов
	var orderIDs []uuid.UUID
	for _, order := range orders {
		orderIDs = append(orderIDs, order.ID)
	}

	var addresses []models.Address
	if err := migrations.DB.Where("order_id IN ?", orderIDs).Find(&addresses).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Database error while fetching addresses")
		http.Error(w, "Error fetching addresses", http.StatusInternalServerError)
		return
	}

	addressMap := make(map[uuid.UUID]models.Address)
	for _, address := range addresses {
		addressMap[address.OrderID] = address
	}

	// 6. Создаем структуру для ответа
	type OrderItemWithDish struct {
		OrderItem models.OrderDish `json:"order_item"`
		Dish      models.Dish      `json:"dish"`
	}

	type OrderResponse struct {
		models.Order
		Items   []OrderItemWithDish `json:"items"`
		Address models.Address      `json:"address"`
	}

	var response []OrderResponse
	for _, order := range orders {
		var items []OrderItemWithDish
		for _, item := range order.OrderItems {
			items = append(items, OrderItemWithDish{
				OrderItem: item,
				Dish:      dishMap[item.DishID],
			})
		}

		response = append(response, OrderResponse{
			Order:   order,
			Items:   items,
			Address: addressMap[order.ID],
		})
	}

	utils.JSONFormat(w, r, response)
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Orders retrieved successfully")
}

func SetStatusCourierHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	status := r.URL.Query().Get("status")
	userID, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusUnauthorized, nil, startTime, "Invalid user ID in request context")
		http.Error(w, "Invalid user ID", http.StatusUnauthorized)
		return
	}
	var courier models.Courier
	if err := migrations.DB.Preload("User").Where("user_id = ?", userID).First(&courier).Error; err != nil {
		log.Println("Courier not found")
		http.Error(w, "Courier not found", http.StatusNotFound)
		return
	}
	if status == courier.Status {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, nil, time.Now(), "Courier status is already setted")
		http.Error(w, "Courier status is already setted", http.StatusBadRequest)
		return
	}
	if (status == models.UNACTIVE || status == models.WAITING) && status == models.ACTIVE {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, nil, time.Now(), "Courier now is active")
		http.Error(w, "Courier now is active", http.StatusBadRequest)
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
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, nil, time.Now(), "Invalid status")
		http.Error(w, "Invalid status", http.StatusBadRequest)
		return
	}
	if err := migrations.DB.Save(&courier).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, time.Now(), "Courier save error")
		http.Error(w, "Courier save failed", http.StatusInternalServerError)
		return
	}
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, time.Now(), "Courier saved")
	w.WriteHeader(http.StatusOK)
	utils.JSONFormat(w, r, map[string]interface{}{
		"username": courier.User.Name,
		"status":   courier.Status,
	})
}

func SetCourierOnOrderHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusUnauthorized, nil, startTime, "Invalid or missing user ID")
		http.Error(w, "Invalid or missing user ID", http.StatusUnauthorized)
		return
	}

	orderID := mux.Vars(r)["orderID"]
	if _, err := uuid.Parse(orderID); err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, err, startTime, "Invalid order ID format")
		http.Error(w, "Invalid order ID format", http.StatusBadRequest)
		return
	}

	tx := migrations.DB.Begin()
	defer tx.Rollback()

	if tx.Error != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, tx.Error, startTime, "Failed to start transaction")
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var courier models.Courier
	if err := tx.Where("user_id = ?", userID).First(&courier).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "Courier not found")
		http.Error(w, "Courier not found", http.StatusNotFound)
		return
	}

	var order models.Order
	if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("id = ?", orderID).First(&order).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "Order not found")
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	if order.Status != models.WAITFREECOURIER {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusConflict, nil, startTime, "Order is already taken")
		http.Error(w, "Order is already taken", http.StatusConflict)
		return
	}

	if courier.Status != models.WAITING {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusConflict, nil, startTime, "Courier status is not available")
		http.Error(w, "Courier status is not available. Need courier status = waiting", http.StatusConflict)
		return
	}

	order.Status = models.ONTHEWAY
	order.CourierID = courier.ID
	courier.Status = models.ACTIVE

	if err := tx.Save(&order).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to save order changes")
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	if err := tx.Save(&courier).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to save courier changes")
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var address models.Address
	if err := tx.Where("order_id = ?", order.ID).First(&address).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "Address not found for order")
		http.Error(w, "Address not found", http.StatusNotFound)
		return
	}

	if err := tx.Commit().Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Transaction commit failed")
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	utils.JSONFormat(w, r, order)
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Courier successfully assigned to order")
}

func SetFinishOrderByCourierHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusUnauthorized, nil, startTime, "Invalid or missing user ID")
		http.Error(w, "Invalid or missing user ID", http.StatusUnauthorized)
		return
	}

	tx := migrations.DB.Begin()
	defer tx.Rollback()

	var courier models.Courier
	if err := tx.Where("user_id = ?", userID).First(&courier).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "Courier not found")
		http.Error(w, "Courier not found", http.StatusNotFound)
		return
	}

	var order models.Order
	if err := tx.Where("courier_id = ? AND status = ?", courier.ID, models.ONTHEWAY).First(&order).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "Order not found or not in transit")
		http.Error(w, "Order not found or not in transit", http.StatusNotFound)
		return
	}

	var checker models.Checker
	if err := tx.Where("order_id = ?", order.ID).First(&checker).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "Checker not found for order")
		http.Error(w, "Checker not found", http.StatusNotFound)
		return
	}

	checkCodeStr := r.URL.Query().Get("code")
	if checkCodeStr == "" {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, nil, startTime, "Check code is required")
		http.Error(w, "Check code is required", http.StatusBadRequest)
		return
	}

	checkCode, err := strconv.ParseUint(checkCodeStr, 10, 32)
	if err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, err, startTime, "Invalid check code format")
		http.Error(w, "Invalid check code format", http.StatusBadRequest)
		return
	}

	if uint(checkCode) != checker.CodeChecker {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, nil, startTime, "Invalid check code entered")
		http.Error(w, "Invalid check code", http.StatusBadRequest)
		return
	}

	order.Status = models.CLOSED
	courier.Status = models.WAITING
	courier.OrdersCount++

	if err := tx.Save(&order).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to update order status")
		http.Error(w, "Failed to update order status", http.StatusInternalServerError)
		return
	}

	if err := tx.Save(&courier).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to update courier status")
		http.Error(w, "Failed to update courier status", http.StatusInternalServerError)
		return
	}

	if err := tx.Delete(&checker).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to delete checker")
		http.Error(w, "Failed to delete checker", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit().Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Transaction commit failed")
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	utils.JSONFormat(w, r, order)
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Order successfully completed by courier")
}
