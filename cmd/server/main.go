package main

import (
	"Sneszana/config"
	"Sneszana/database/migrations"
	"Sneszana/handlers"
	"Sneszana/logging"
	"Sneszana/models"
	"Sneszana/utils"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func main() {

	config.LoadEnv()
	migrations.InitDB()
	config.InitRedis()

	restaurantID := uuid.MustParse("029c4df8-4c4f-488e-9a96-1a4fe54acc18")
	//migrations.DB.Migrator().DropTable(models.Dish{})
	//dishes := []models.Dish{
	//	{
	//		Name:        "Борщ с пампушками",
	//		Description: "Классический борщ с чесночными пампушками",
	//		Price:       350,
	//		ImageURL:    "https://images.gastronom.ru/XnPBSOmgMujDT1-9VNfyRcBeKQnwhcEiQCnThIWkSD4/pr:recipe-cover-image/g:ce/rs:auto:0:0:0/L2Ntcy9hbGwtaW1hZ2VzLzQwZmY5NDc3LTJhYWMtNGQ1OC05MWM0LTM1MTFkMjY0ZDEwMS5qcGc.webp",
	//		Ingredients: "Свекла, капуста, мясо, картофель, морковь",
	//	},
	//	{
	//		Name:        "Солянка сборная",
	//		Description: "Ароматный суп с мясными деликатесами",
	//		Price:       420,
	//		ImageURL:    "https://pic.rutubelist.ru/video/41/ed/41ede0802ea63cf615fdc968c9fcaffe.jpg",
	//		Ingredients: "Колбаса, копчёности, маслины, лимон",
	//	},
	//	{
	//		Name:        "Оливье",
	//		Description: "Традиционный салат с майонезом",
	//		Price:       280,
	//		ImageURL:    "https://avatars.mds.yandex.net/get-altay/1975185/2a00000177e2cfd92bf805852bf5edb10ccc/XXXL",
	//		Ingredients: "Картофель, морковь, колбаса, горошек, яйца",
	//	},
	//	{
	//		Name:        "Винегрет",
	//		Description: "Лёгкий овощной салат с квашеной капустой",
	//		Price:       250,
	//		ImageURL:    "https://fort.crimea.com/catering/uploads/fotos/a89f02c9-65c2-11e9-9c6d-54a05051519a_1.jpg",
	//		Ingredients: "Свекла, морковь, картофель, огурцы, капуста",
	//	},
	//	{
	//		Name:        "Пельмени домашние",
	//		Description: "Сочные пельмени с мясной начинкой",
	//		Price:       380,
	//		ImageURL:    "https://static.1000.menu/img/content-v2/a5/13/42853/pelmeni-domashnie-klassicheskie_1613478070_16_max.jpg",
	//		Ingredients: "Мука, яйцо, мясной фарш, лук",
	//	},
	//	{
	//		Name:        "Вареники с вишней",
	//		Description: "Классические вареники с кисло-сладкой вишней",
	//		Price:       320,
	//		ImageURL:    "https://www.ermolino-produkty.ru/recipes/picts/recipes/tnw1000-670х430_vareniki_s_vishnej_na_paru.jpg",
	//		Ingredients: "Тесто, вишня, сахар",
	//	},
	//	{
	//		Name:        "Жаркое по-домашнему",
	//		Description: "Картофель с мясом в горшочке",
	//		Price:       450,
	//		ImageURL:    "https://ferma-m2.ru/images/shop/recipe_image/crop__8_1.jpg",
	//		Ingredients: "Свинина, картофель, лук, морковь",
	//	},
	//	{
	//		Name:        "Котлета по-киевски",
	//		Description: "Куриная котлета с маслом и зеленью",
	//		Price:       470,
	//		ImageURL:    "https://rud.ua/uploads/under_recipe/02_600x300_5f686cb1bd6ca.jpg",
	//		Ingredients: "Куриное филе, масло, зелень, панировка",
	//	},
	//	{
	//		Name:        "Голубцы",
	//		Description: "Тушёная капуста с мясным фаршем и рисом",
	//		Price:       390,
	//		ImageURL:    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRB1trl4_oWYxLH1gsGKW6ZBASc7xKVpL5vZw&s",
	//		Ingredients: "Капуста, фарш, рис, томаты",
	//	},
	//	{
	//		Name:        "Плов узбекский",
	//		Description: "Рассыпчатый плов с бараниной",
	//		Price:       520,
	//		ImageURL:    "https://images.gastronom.ru/vS3eDA6DMddFCsm2Bv0P1yuw1SOCkmLYhYTJo53SwZo/pr:recipe-cover-image/g:ce/rs:auto:0:0:0/L2Ntcy9hbGwtaW1hZ2VzLzU2OTU3OTRkLTZiYmEtNGI1YS05ZWM1LWViZDVkZWE4MGEyNy5qcGc.webp",
	//		Ingredients: "Рис, баранина, морковь, лук",
	//	},
	//	{
	//		Name:        "Бефстроганов",
	//		Description: "Говядина в сливочном соусе",
	//		Price:       530,
	//		ImageURL:    "https://www.man-meat.ru/upload/iblock/133/beef_stroganoff_Comp.jpg",
	//		Ingredients: "Говядина, сливки, лук, специи",
	//	},
	//	{
	//		Name:        "Гречка с грибами",
	//		Description: "Ароматная гречка с обжаренными грибами",
	//		Price:       310,
	//		ImageURL:    "https://cdn.lifehacker.ru/wp-content/uploads/2024/11/103_1732278919.jpg",
	//		Ingredients: "Гречка, грибы, лук, масло",
	//	},
	//	{
	//		Name:        "Каша овсяная",
	//		Description: "Овсянка с орехами и мёдом",
	//		Price:       290,
	//		ImageURL:    "https://здоровое-питание.рф/upload/iblock/4fa/pztyoarqv99ksr1hvbzqe3onpeqg4dk7/_Nadezhda_Mishkova_Fotobank_Lori_2.jpg",
	//		Ingredients: "Овсянка, молоко, мёд, орехи",
	//	},
	//	{
	//		Name:        "Сырники",
	//		Description: "Творожные сырники со сметаной",
	//		Price:       360,
	//		ImageURL:    "https://images.gastronom.ru/YzwulNpKDDD_5PWcMEVYeQ1eq1lnsKrihS24Bh6ihTw/pr:recipe-preview-image/g:ce/rs:auto:0:0:0/L2Ntcy9hbGwtaW1hZ2VzLzliOTRhNTg5LTlmNzYtNGNlNS04MTgzLTc4MjU0MGI0ZGI3Yy5qcGc",
	//		Ingredients: "Творог, яйца, мука, сахар",
	//	},
	//	{
	//		Name:        "Шарлотка яблочная",
	//		Description: "Классический яблочный пирог",
	//		Price:       380,
	//		ImageURL:    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZzHb-6cOTxvgNck0M9NeKnypLYaFQDKTz5Q&s",
	//		Ingredients: "Яблоки, мука, сахар, корица",
	//	},
	//	{
	//		Name:        "Медовик",
	//		Description: "Слоёный медовый торт",
	//		Price:       450,
	//		ImageURL:    "https://cdnn21.img.ria.ru/images/07e8/09/10/1972971537_0:159:3076:1889_1920x1080_80_0_0_bf8c3059c02760346886670321765108.jpg",
	//		Ingredients: "Мёд, мука, яйца, сметана",
	//	},
	//	{
	//		Name:        "Чай с облепихой",
	//		Description: "Ароматный облепиховый чай с мёдом",
	//		Price:       210,
	//		ImageURL:    "https://teatraditions.ru/image/catalog/stati/teaobl/1.jpg",
	//		Ingredients: "Облепиха, мёд, вода",
	//	},
	//	{
	//		Name:        "Морс клюквенный",
	//		Description: "Освежающий морс из клюквы",
	//		Price:       180,
	//		ImageURL:    "https://alimero.ru/uploads/images/16/38/88/2018/02/03/f06493_wmark.jpg",
	//		Ingredients: "Клюква, сахар, вода",
	//	},
	//	{
	//		Name:        "Драники с чесноком",
	//		Description: "Картофельные оладьи с чесночным соусом",
	//		Price:       330,
	//		ImageURL:    "https://img.povar.ru/mobile/59/86/6c/e6/vkusnie_kartofelnie_draniki-769913.JPG",
	//		Ingredients: "Картофель, мука, чеснок, сметана",
	//	},
	//	{
	//		Name:        "Холодец",
	//		Description: "Мясной студень с хреном",
	//		Price:       340,
	//		ImageURL:    "https://beregifiguru.ru/Storage/Food/Холодец-из-говядины-102345.jpg?636194873297111359",
	//		Ingredients: "Говядина, свинина, специи, желатин",
	//	},
	//}
	//
	//for i := range dishes {
	//	dishes[i].RestaurantID = restaurantID
	//}

	migrations.DB.Create(&dishes)

	r := mux.NewRouter()
	logging.InitLogging()
	logging.Log.Info("Сервер запущен успешно")

	apiRouter := r.PathPrefix("/api").Subrouter()
	r.PathPrefix("/").Handler(spaHandler("./frontend/dist"))
	apiRouter.HandleFunc("/ping", handlers.PingHandler).Methods("GET")

	dishesRouter := apiRouter.PathPrefix("/dishes").Subrouter()
	dishesRouter.HandleFunc("", handlers.ShowDishesHandler).Methods("GET")
	dishesRouter.HandleFunc("/{id}", handlers.ShowDishByIDHandler).Methods("GET")
	dishesRouter.HandleFunc("/{id}/reviews", handlers.ShowReviewsDishByIDHandler).Methods("GET")

	authRouter := apiRouter.PathPrefix("/auth").Subrouter()
	authRouter.HandleFunc("/register", handlers.RegisterHandler).Methods("POST")
	authRouter.HandleFunc("/login", handlers.LoginHandler).Methods("POST")
	authRouter.HandleFunc("/logout", handlers.LogoutHandler).Methods("POST")

	kitchenRouter := apiRouter.PathPrefix("/kitchen").Subrouter()
	//kitchenRouter.Use(utils.AuthMiddleware(models.STAFF_ROLE))
	kitchenRouter.HandleFunc("/{id}", handlers.ChangeStaffStatusOrderHandler).Methods("POST")
	kitchenRouter.HandleFunc("/", handlers.ShowCookingOrdersHandler).Methods("GET")

	ordersRouter := apiRouter.PathPrefix("/orders").Subrouter()
	ordersRouter.Use(utils.AuthMiddleware(models.CUSTOMER_ROLE))
	ordersRouter.HandleFunc("/", handlers.ShowOrderHandler).Methods("GET")
	ordersRouter.HandleFunc("/", handlers.CreateOrderHandler).Methods("POST")
	ordersRouter.HandleFunc("/", handlers.DeleteOrderHandler).Methods("DELETE")
	ordersRouter.HandleFunc("/{orderId}", handlers.ShowInformationAboutOrderHandler).Methods("GET")
	ordersRouter.HandleFunc("/add/{id}", handlers.AddToBucketHandler).Methods("POST")
	//ordersRouter.HandleFunc("/reviews/courier/{id}", handlers.SetReviewOnCourierHandler).Methods("POST")

	//оставить отзыв на блюдо может человек который купил когда-то этот товар
	ordersRouter.HandleFunc("/reviews/dish/{id}", handlers.SetReviewOnDishHandler).Methods("POST")
	ordersRouter.HandleFunc("/reviews/dish/{id}", handlers.ShowReviewOnDishHandler).Methods("GET")

	adminRouter := apiRouter.PathPrefix("/admin").Subrouter()
	adminRouter.Use(utils.AuthMiddleware(models.ADMIN_ROLE))
	adminRouter.HandleFunc("/couriers", handlers.ShowAllCouriersHandler).Methods("GET")
	adminRouter.HandleFunc("/couriers/{id}", handlers.ShowCourierHandler).Methods("GET")
	adminRouter.HandleFunc("/users", handlers.ShowAllUsersHandler).Methods("GET")
	adminRouter.HandleFunc("/users/{username}", handlers.SetRolesHandler).Methods("PUT")
	adminRouter.HandleFunc("/dishes", handlers.ShowAllDishesHandler).Methods("GET")
	adminRouter.HandleFunc("/dishes/{id}", handlers.ChangePriceHandler).Methods("PUT")
	adminRouter.HandleFunc("/dishes/{id}", handlers.DeleteDishesHandler).Methods("DELETE")
	//adminRouter.HandleFunc("/reviews", handlers.ShowReviewsStatusHandler).Methods("GET")
	adminRouter.HandleFunc("/reviews/{id}", handlers.ChangeReviewsStatusHandler).Methods("PUT")

	courierRouter := apiRouter.PathPrefix("/courier").Subrouter()
	courierRouter.Use(utils.AuthMiddleware(models.COURIER_ROLE))
	courierRouter.HandleFunc("", handlers.ShowCourierInformationHandler).Methods("GET")
	courierRouter.HandleFunc("/status/set", handlers.SetStatusCourierHandler).Methods("PUT")
	courierRouter.HandleFunc("/orders", handlers.GetActuallOrdersHandler).Methods("GET")
	courierRouter.HandleFunc("/orders/{orderID}", handlers.SetCourierOnOrderHandler).Methods("POST")
	courierRouter.HandleFunc("/orders/setStatus", handlers.SetFinishOrderByCourierHandler).Methods("PUT")

	restaurantsRouter := apiRouter.PathPrefix("/restaurants").Subrouter()
	restaurantsRouter.HandleFunc("/menu", handlers.RestaurantsMenuHandler).Methods("GET")
	restaurantsRouter.HandleFunc("/menu/{id}", handlers.DishHandler).Methods("GET")

	buildPath := "./frontend/build"
	r.PathPrefix("/").Handler(spaHandler(buildPath))

	handler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}).Handler(r)

	log.Println("Server listening on port 8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func spaHandler(buildDir string) http.HandlerFunc {
	fs := http.FileServer(http.Dir(buildDir))

	return func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(buildDir, r.URL.Path)

		_, err := os.Stat(path)
		if os.IsNotExist(err) {
			http.ServeFile(w, r, filepath.Join(buildDir, "index.html"))
			return
		}
		fs.ServeHTTP(w, r)
	}
}
