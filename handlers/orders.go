package handlers

import (
	"Sneszana/database/migrations"
	"Sneszana/models"
	"Sneszana/utils"
	"encoding/json"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
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
	userId, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		log.Println("invalid user ID")
		http.Error(w, "invalid user ID", http.StatusUnauthorized)
		return
	}
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
	var orders []models.Order
	if err := tx.Where("user_id = ?", userId).Find(&orders).Error; err != nil {
		tx.Rollback()
		log.Println("error, failed to fetch orders")
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	utils.JSONFormat(w, r, orders)
}

func ShowInformationAboutOrderHandler(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)

	orderIdStr := params["orderId"]
	if orderIdStr == "" {
		log.Println("missing order ID")
		http.Error(w, "missing order ID", http.StatusBadRequest)
		return
	}

	orderId, err := uuid.Parse(orderIdStr)
	if err != nil {
		log.Println("invalid order ID format")
		http.Error(w, "invalid order ID format", http.StatusBadRequest)
		return
	}

	userId, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		log.Println("invalid user ID")
		http.Error(w, "invalid user ID", http.StatusUnauthorized)
		return
	}

	var order models.Order
	if err := migrations.DB.Where("user_id = ? AND id = ?", userId, orderId).First(&order).Error; err != nil {
		log.Println("error, failed to fetch order")
		http.Error(w, "order not found", http.StatusNotFound)
		return
	}

	var orderDishes []models.OrderDish
	if err := migrations.DB.Where("order_id = ?", order.ID).Find(&orderDishes).Error; err != nil {
		log.Println("error, failed to fetch dishes")
		http.Error(w, "dishes not found", http.StatusNotFound)
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
			log.Println("error, failed to fetch dish details")
			http.Error(w, "dish details not found", http.StatusNotFound)
			return
		}

		result = append(result, OrderDishDetails{
			Count: orderDish.Count,
			Dish:  dish,
		})
	}

	utils.JSONFormat(w, r, result)
}

func AddToBucketHandler(w http.ResponseWriter, r *http.Request) {
	userId, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		log.Println("invalid user ID")
		http.Error(w, "invalid user ID", http.StatusUnauthorized)
		return
	}
	dishId := mux.Vars(r)["id"]

	var dish models.Dish
	if err := migrations.DB.Where("id = ?", dishId).First(&dish).Error; err != nil {
		log.Println("error, failed to find dish with id: " + dishId)
		http.Error(w, "error, failed to find dish with id: "+dishId, http.StatusNotFound)
		return
	}

	tx := migrations.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()
	if tx.Error != nil {
		log.Println("error, failed to start transaction")
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	var order models.Order
	if err := tx.Where("user_id = ? AND status = 'created'", userId).First(&order).Error; err != nil {
		order = models.Order{
			UserID: userId,
			Price:  0,
			Status: "created",
		}
		if err := tx.Create(&order).Error; err != nil {
			tx.Rollback()
			log.Println("error, failed to create order")
			http.Error(w, "error, failed to create order", http.StatusInternalServerError)
			return
		}
	}

	var orderDish models.OrderDish
	if err := tx.Where("order_id = ? AND dish_id = ?", order.ID, dish.ID).First(&orderDish).Error; err == nil {
		orderDish.Count += 1
		if err := tx.Save(&orderDish).Error; err != nil {
			tx.Rollback()
			log.Println("error, failed to update orderDish count")
			http.Error(w, "error, failed to update orderDish count", http.StatusInternalServerError)
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
			log.Println("error, failed to create orderDish")
			http.Error(w, "error, failed to create orderDish", http.StatusInternalServerError)
			return
		}
	}
	order.Price += dish.Price
	if err := tx.Save(&order).Error; err != nil {
		tx.Rollback()
		log.Println("error, failed to update order")
		http.Error(w, "error, failed to update order", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit().Error; err != nil {
		log.Println("error, failed to commit transaction")
		http.Error(w, "error, failed to commit transaction", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Dish added to bucket successfully"))
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
		"message": "Order start to cook. your checker code, show it courier for accept finish order",
		"code":    code,
	}
	utils.JSONFormat(w, r, response)

}

func UpdateOrderHandler(writer http.ResponseWriter, request *http.Request) {

}

func DeleteOrderHandler(w http.ResponseWriter, r *http.Request) {
	userId, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		log.Println("invalid user ID")
		http.Error(w, "invalid user ID", http.StatusUnauthorized)
		return
	}

	tx := migrations.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()
	defer tx.Rollback()

	if tx.Error != nil {
		log.Println("error, failed to start transaction")
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	var order models.Order
	if err := tx.Where("user_id = ? AND status = 'created'", userId).First(&order).Error; err != nil {
		log.Println("error, failed to find order")
		http.Error(w, "error, failed to find order", http.StatusNotFound)
		return
	}

	if err := tx.Where("order_id = ?", order.ID).Delete(&models.OrderDish{}).Error; err != nil {
		log.Println("error, failed to delete order dishes")
		http.Error(w, "error, failed to delete order dishes", http.StatusInternalServerError)
		return
	}

	if err := tx.Delete(&order).Error; err != nil {
		log.Println("error, failed to delete order")
		http.Error(w, "error, failed to delete order", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit().Error; err != nil {
		log.Println("error, failed to commit transaction")
		http.Error(w, "error, failed to commit transaction", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Order deleted successfully"))
}

func ShowReviewOnDishHandler(w http.ResponseWriter, r *http.Request) {
	dishID, err := uuid.Parse(mux.Vars(r)["id"])
	if err != nil {
		log.Println("error converting id to uuid")
		http.Error(w, "error converting id to uuid", http.StatusBadRequest)
		return
	}
	var dish models.Dish
	if err := migrations.DB.Where("id = ?", dishID).First(&dish).Error; err != nil {
		log.Println("error, failed to find dish")
		http.Error(w, "error, failed to find dish", http.StatusNotFound)
		return
	}
	var reviews []models.Review
	if err := migrations.DB.Where("dish_id = ? AND status = ?", dish.ID, models.ACCEPT).Find(&reviews).Error; err != nil {
		log.Println("error, failed to find reviews")
		http.Error(w, "error, failed to find reviews", http.StatusNotFound)
		return
	}
	utils.JSONFormat(w, r, reviews)
}

func SetReviewOnDishHandler(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value("userID").(uuid.UUID)

	var user models.User
	if err := migrations.DB.Where("id = ?", userId).First(&user).Error; err != nil {
		log.Println("error, failed to find user")
		http.Error(w, "error, failed to find user", http.StatusNotFound)
		return
	}

	dishID, err := uuid.Parse(mux.Vars(r)["id"])
	if err != nil {
		log.Println("error converting id to uuid")
		http.Error(w, "error converting id to uuid", http.StatusBadRequest)
		return
	}

	var dish models.Dish
	if err := migrations.DB.Where("id = ?", dishID).First(&dish).Error; err != nil {
		log.Println("error, failed to find dish")
		http.Error(w, "error, failed to find dish", http.StatusNotFound)
		return
	}

	var review models.Review
	if err := json.NewDecoder(r.Body).Decode(&review); err != nil {
		log.Println("error, failed to decode review")
		http.Error(w, "error, failed to decode review", http.StatusBadRequest)
		return
	}

	if review.Mark < 1 || review.Mark > 5 {
		log.Println("error, mark must be between 1 and 5")
		http.Error(w, "error, mark must be between 1 and 5", http.StatusBadRequest)
		return
	}

	review.TextMessage = strings.TrimSpace(review.TextMessage)
	if review.TextMessage == "" {
		log.Println("error. write incorrect information")
		http.Error(w, "error. write incorrect information", http.StatusBadRequest)
		return
	}

	tx := migrations.DB.Begin()
	defer tx.Rollback()

	review.DishID = dish.ID

	var count int64
	err = tx.Table("order_dishes").
		Joins("JOIN orders ON orders.id = order_dishes.order_id").
		Where("orders.user_id = ? AND orders.status = ? AND order_dishes.dish_id = ?", userId, models.CLOSED, review.DishID).
		Count(&count).Error

	if err != nil || count == 0 {
		log.Println("user never ordered this dish")
		http.Error(w, "user never ordered this dish", http.StatusForbidden)
		return
	}

	var existingReview models.Review
	if err := tx.Where("user_id = ? AND dish_id = ?", userId, review.DishID).First(&existingReview).Error; err == nil {
		log.Println("error, review already exists for this dish")
		http.Error(w, "error, review already exists for this dish", http.StatusConflict)
		return
	}

	review.UserID = userId
	review.Status = models.CHECK
	if err := tx.Create(&review).Error; err != nil {
		log.Println("error, failed to create review")
		http.Error(w, "error, failed to create review", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit().Error; err != nil {
		log.Println("transaction commit failed")
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	utils.JSONFormat(w, r, map[string]interface{}{
		"text_user":      "now your review on cheking by admin",
		"dish":           dish.Name,
		"review_message": review.TextMessage,
		"mark":           review.Mark})
}
