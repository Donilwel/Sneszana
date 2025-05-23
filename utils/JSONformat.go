package utils

import (
	"encoding/json"
	"log"
	"net/http"
)

func JSONFormat(w http.ResponseWriter, r *http.Request, v interface{}) {
	formattedJSON, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		log.Println("Ошибка при форматировании JSON:", err)
		http.Error(w, "Ошибка сервера", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, err = w.Write(formattedJSON)
	if err != nil {
		log.Println("Ошибка при JSON:", err)
		http.Error(w, "Неопознанная ошибка.", http.StatusInternalServerError)
	}
	log.Println("Ответ отправлен клиенту")
}

func WriteJSONError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": message})
}
