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
	"log"
	"math/rand"
	"net/http"
	"strings"
	"time"
)

func generateCode() uint {
	rand.Seed(time.Now().UnixNano())
	return uint(100000 + rand.Intn(900000))
}

func ShowOrderHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusUnauthorized, nil, startTime, "Invalid user ID in request context")
		http.Error(w, "Invalid user ID", http.StatusUnauthorized)
		return
	}

	tx := migrations.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to start transaction")
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var orders []models.Order
	if err := tx.Where("user_id = ?", userID).Find(&orders).Error; err != nil {
		tx.Rollback()
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to fetch orders")
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if len(orders) == 0 {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, nil, startTime, "No orders found for user")
		http.Error(w, "No orders found", http.StatusNotFound)
		return
	}

	utils.JSONFormat(w, r, orders)
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Orders retrieved successfully")
}

func ShowInformationAboutOrderHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()

	orderIDStr := mux.Vars(r)["orderId"]
	if orderIDStr == "" {
		logging.LogRequest(logrus.WarnLevel, uuid.Nil, r, http.StatusBadRequest, nil, startTime, "Missing order ID in request")
		http.Error(w, "Missing order ID", http.StatusBadRequest)
		return
	}

	orderID, err := uuid.Parse(orderIDStr)
	if err != nil {
		logging.LogRequest(logrus.WarnLevel, uuid.Nil, r, http.StatusBadRequest, err, startTime, "Invalid order ID format")
		http.Error(w, "Invalid order ID format", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusUnauthorized, nil, startTime, "Invalid or missing user ID")
		http.Error(w, "Invalid or missing user ID", http.StatusUnauthorized)
		return
	}

	var order models.Order
	if err := migrations.DB.Where("user_id = ? AND id = ?", userID, orderID).First(&order).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "Order not found for user")
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	var orderDishes []models.OrderDish
	if err := migrations.DB.Where("order_id = ?", order.ID).Find(&orderDishes).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "Dishes not found for order")
		http.Error(w, "Dishes not found", http.StatusNotFound)
		return
	}

	type OrderDishDetails struct {
		Count int         `json:"count"`
		Dish  models.Dish `json:"dish"`
	}

	var result []OrderDishDetails
	for _, orderDish := range orderDishes {
		var dish models.Dish
		if err := migrations.DB.Where("id = ?", orderDish.DishID).First(&dish).Error; err != nil {
			logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "Dish details not found for order")
			http.Error(w, "Dish details not found", http.StatusNotFound)
			return
		}

		result = append(result, OrderDishDetails{
			Count: orderDish.Count,
			Dish:  dish,
		})
	}

	utils.JSONFormat(w, r, map[string]interface{}{
		"all dishes":  result,
		"total price": order.Price,
	})

	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Order details retrieved successfully")
}

func ShowReviewOnDishHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, _ := r.Context().Value("userID").(uuid.UUID)

	dishID, err := uuid.Parse(mux.Vars(r)["id"])
	if err != nil {
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

	var reviews []models.Review
	if err := migrations.DB.Where("dish_id = ? AND status = ?", dish.ID, models.ACCEPT).Find(&reviews).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "No accepted reviews found for dish")
		http.Error(w, "No accepted reviews found", http.StatusNotFound)
		return
	}

	utils.JSONFormat(w, r, reviews)
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Reviews retrieved successfully for dish")
}

func CreateOrderHandler(w http.ResponseWriter, r *http.Request) {
	userId, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		log.Println("invalid user ID")
		http.Error(w, "invalid user ID", http.StatusUnauthorized)
		return
	}
	var address models.Address
	if err := json.NewDecoder(r.Body).Decode(&address); err != nil {
		http.Error(w, "error. write incorrect information", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if address.DomophoneCode == "" || address.HouseNumber == "" || address.Phone == "" || address.Street == "" || address.Apartment == "" {
		log.Println("invalid address")
		http.Error(w, "error. write incorrect information", http.StatusBadRequest)
		return
	}

	var order models.Order
	tx := migrations.DB.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()
	if err := tx.Error; err != nil {
		log.Println("error, failed to start transaction")
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := tx.Where("user_ID = ? AND status = 'created'", userId).First(&order).Error; err != nil {
		tx.Rollback()
		log.Println("error, failed to find created order by current user")
		http.Error(w, "error, failed to find created order by current user", http.StatusNotFound)
		return
	}
	address.OrderID = order.ID
	order.Status = models.COOKING
	if err := tx.Save(&order).Error; err != nil {
		tx.Rollback()
		log.Println("error, failed to update order")
		http.Error(w, "error, failed to update order", http.StatusInternalServerError)
		return
	}
	var code = generateCode()
	if err := migrations.DB.Create(&models.Checker{
		OrderID:     order.ID,
		CodeChecker: code,
	}).Error; err != nil {
		tx.Rollback()
		log.Println("error, failed to create checker")
		http.Error(w, "error, failed to create checker", http.StatusInternalServerError)
		return
	}
	if err := tx.Create(&address).Error; err != nil {
		tx.Rollback()
		log.Println("error, failed to create address")
		http.Error(w, "error, failed to create address", http.StatusInternalServerError)
		return
	}
	tx.Commit()
	log.Println("Order start to cook")
	w.WriteHeader(http.StatusOK)
	response := map[string]interface{}{
		"message": "Заказ начинаем готовить. Ваш код чека, покажите его курьеру для принятия и завершения заказа",
		"code":    code,
	}
	utils.JSONFormat(w, r, response)

}

func AddToBucketHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusUnauthorized, nil, startTime, "Invalid or missing user ID")
		http.Error(w, "Invalid user ID", http.StatusUnauthorized)
		return
	}

	dishIDStr := mux.Vars(r)["id"]
	dishID, err := uuid.Parse(dishIDStr)
	if err != nil {
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

	tx := migrations.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()
	if tx.Error != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, tx.Error, startTime, "Failed to start transaction")
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var order models.Order
	if err := tx.Where("user_id = ? AND status = 'created'", userID).First(&order).Error; err != nil {
		order = models.Order{
			UserID: userID,
			Price:  0,
			Status: "created",
		}
		if err := tx.Create(&order).Error; err != nil {
			tx.Rollback()
			logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to create order")
			http.Error(w, "Failed to create order", http.StatusInternalServerError)
			return
		}
	}

	var orderDish models.OrderDish
	if err := tx.Where("order_id = ? AND dish_id = ?", order.ID, dish.ID).First(&orderDish).Error; err == nil {
		orderDish.Count += 1
		if err := tx.Save(&orderDish).Error; err != nil {
			tx.Rollback()
			logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to update orderDish count")
			http.Error(w, "Failed to update orderDish count", http.StatusInternalServerError)
			return
		}
	} else {
		orderDish = models.OrderDish{
			OrderID: order.ID,
			DishID:  dish.ID,
			Count:   1,
		}
		if err := tx.Create(&orderDish).Error; err != nil {
			tx.Rollback()
			logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to create orderDish entry")
			http.Error(w, "Failed to create orderDish", http.StatusInternalServerError)
			return
		}
	}

	order.Price += dish.Price
	if err := tx.Save(&order).Error; err != nil {
		tx.Rollback()
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to update order price")
		http.Error(w, "Failed to update order", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit().Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to commit transaction")
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Dish added to bucket successfully")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Dish added to bucket successfully"))
}

func SetReviewOnDishHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()
	userID, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusUnauthorized, nil, startTime, "Invalid or missing user ID")
		utils.WriteJSONError(w, http.StatusUnauthorized, "Invalid user ID") // Используем WriteJSONError
		return
	}

	var user models.User
	if err := migrations.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "User not found")
		utils.WriteJSONError(w, http.StatusNotFound, "User not found") // Используем WriteJSONError
		return
	}

	dishID, err := uuid.Parse(mux.Vars(r)["id"])
	if err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, err, startTime, "Invalid dish ID format")
		utils.WriteJSONError(w, http.StatusBadRequest, "Invalid dish ID format") // Используем WriteJSONError
		return
	}

	var dish models.Dish
	if err := migrations.DB.Where("id = ?", dishID).First(&dish).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "Dish not found")
		utils.WriteJSONError(w, http.StatusNotFound, "Dish not found") // Используем WriteJSONError
		return
	}

	var review models.Review
	if err := json.NewDecoder(r.Body).Decode(&review); err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, err, startTime, "Invalid review JSON format")
		utils.WriteJSONError(w, http.StatusBadRequest, "Invalid review format") // Используем WriteJSONError
		return
	}

	if review.Mark < 1 || review.Mark > 5 {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, nil, startTime, "Invalid review mark (must be between 1 and 5)")
		utils.WriteJSONError(w, http.StatusBadRequest, "Mark must be between 1 and 5") // Используем WriteJSONError
		return
	}

	review.TextMessage = strings.TrimSpace(review.TextMessage)
	if review.TextMessage == "" {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusBadRequest, nil, startTime, "Empty review text")
		utils.WriteJSONError(w, http.StatusBadRequest, "Review text cannot be empty") // Используем WriteJSONError
		return
	}

	tx := migrations.DB.Begin()
	defer tx.Rollback()

	review.DishID = dish.ID

	var count int64
	err = tx.Table("order_dishes").
		Joins("JOIN orders ON orders.id = order_dishes.order_id").
		Where("orders.user_id = ? AND orders.status = ? AND order_dishes.dish_id = ?", userID, models.CLOSED, review.DishID).
		Count(&count).Error

	if err != nil || count == 0 {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusForbidden, err, startTime, "User has never ordered this dish")
		utils.WriteJSONError(w, http.StatusForbidden, "You can only review dishes you have ordered") // Используем WriteJSONError
		return
	}

	var existingReview models.Review
	if err := tx.Where("user_id = ? AND dish_id = ?", userID, review.DishID).First(&existingReview).Error; err == nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusConflict, nil, startTime, "User already reviewed this dish")
		utils.WriteJSONError(w, http.StatusConflict, "You have already reviewed this dish") // Используем WriteJSONError
		return
	}

	review.UserID = userID
	review.Status = models.CHECK
	if err := tx.Create(&review).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to create review")
		utils.WriteJSONError(w, http.StatusInternalServerError, "Failed to create review") // Используем WriteJSONError
		return
	}

	if err := tx.Commit().Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Transaction commit failed")
		utils.WriteJSONError(w, http.StatusInternalServerError, "Internal server error") // Используем WriteJSONError
		return
	}

	response := map[string]interface{}{
		"text_user":      "Now your review is under admin review",
		"dish":           dish.Name,
		"review_message": review.TextMessage,
		"mark":           review.Mark,
	}

	utils.JSONFormat(w, r, response)
	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Review submitted successfully")
}

func DeleteOrderHandler(w http.ResponseWriter, r *http.Request) {
	startTime := time.Now()

	orderIDStr := mux.Vars(r)["orderId"]
	if orderIDStr == "" {
		logging.LogRequest(logrus.WarnLevel, uuid.Nil, r, http.StatusBadRequest, nil, startTime, "Missing order ID in request")
		http.Error(w, "Missing order ID", http.StatusBadRequest)
		return
	}

	orderID, err := uuid.Parse(orderIDStr)
	if err != nil {
		logging.LogRequest(logrus.WarnLevel, uuid.Nil, r, http.StatusBadRequest, err, startTime, "Invalid order ID format")
		http.Error(w, "Invalid order ID format", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusUnauthorized, nil, startTime, "Invalid or missing user ID")
		http.Error(w, "Invalid user ID", http.StatusUnauthorized)
		return
	}

	tx := migrations.DB.Begin()
	defer tx.Rollback()

	if tx.Error != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, tx.Error, startTime, "Failed to start transaction")
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var order models.Order
	if err := tx.Where("id = ? AND status = 'created'", orderID).First(&order).Error; err != nil {
		logging.LogRequest(logrus.WarnLevel, userID, r, http.StatusNotFound, err, startTime, "Order not found for user")
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	if err := tx.Where("order_id = ?", order.ID).Delete(&models.OrderDish{}).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to delete order dishes")
		http.Error(w, "Failed to delete order dishes", http.StatusInternalServerError)
		return
	}

	if err := tx.Delete(&order).Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Failed to delete order")
		http.Error(w, "Failed to delete order", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit().Error; err != nil {
		logging.LogRequest(logrus.ErrorLevel, userID, r, http.StatusInternalServerError, err, startTime, "Transaction commit failed")
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	logging.LogRequest(logrus.InfoLevel, userID, r, http.StatusOK, nil, startTime, "Order deleted successfully")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Order deleted successfully"))
}
