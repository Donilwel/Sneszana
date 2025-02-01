package handlers

import (
	"Sneszana/database/migrations"
	"Sneszana/models"
	"Sneszana/utils"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"log"
	"math/rand"
	"net/http"
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

	order.Status = models.COOKING
	if err := tx.Save(&order).Error; err != nil {
		tx.Rollback()
		log.Println("error, failed to update order")
		http.Error(w, "error, failed to update order", http.StatusInternalServerError)
		return
	}
	var code = generateCode()
	if err := migrations.DB.Create(&models.Checker{
		UserID:      userId,
		CodeChecker: code,
	}).Error; err != nil {
		tx.Rollback()
		log.Println("error, failed to create checker")
		http.Error(w, "error, failed to create checker", http.StatusInternalServerError)
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

func SetReviewHandler(w http.ResponseWriter, r *http.Request) {

}
