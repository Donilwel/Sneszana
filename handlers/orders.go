package handlers

import (
	"Sneszana/database/migrations"
	"Sneszana/models"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

func ShowOrderHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	if _, err := w.Write([]byte("pong")); err != nil {
		log.Println("Error, network failed")
	}
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

	tx.Commit()
	log.Println("Order start to cook")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Order start to cook"))

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
