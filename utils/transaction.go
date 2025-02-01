package utils

import (
	"Sneszana/database/migrations"
	"log"
	"net/http"
)

func startTransaction(w http.ResponseWriter) {
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
}
