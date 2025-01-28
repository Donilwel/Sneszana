package handlers

import (
	"log"
	"net/http"
)

func ShowOrderHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	if _, err := w.Write([]byte("pong")); err != nil {
		log.Println("Error, network failed")
	}
}

func CreateOrderHandler(writer http.ResponseWriter, request *http.Request) {

}

func UpdateOrderHandler(writer http.ResponseWriter, request *http.Request) {

}

func DeleteOrderHandler(writer http.ResponseWriter, request *http.Request) {

}
