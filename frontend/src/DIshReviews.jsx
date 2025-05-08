export default function DishReviews() {
    const { id } = useParams();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`/api/orders/reviews/dish/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.message) throw new Error(data.message);
                setReviews(data);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (loading) return <p>Загрузка...</p>;

    return (
        <div style={wrapperStyle}>
            <h2>Отзывы о блюде</h2>
            {/* Вывод отзывов */}
            {reviews.length === 0 ? (
                <p>Пока нет отзывов.</p>
            ) : (
                reviews.map((review) => (
                    <div key={review.id}>
                        <p><strong>{review.user_name || "Аноним"}</strong>: {review.text_message}</p>
                        <p>Оценка: {review.mark}</p>
                    </div>
                ))
            )}
        </div>
    );
}
