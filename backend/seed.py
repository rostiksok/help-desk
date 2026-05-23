"""Seed the database with demo data for development/demo purposes."""
from datetime import datetime, timedelta, timezone
from database import SessionLocal, engine
from models import Base, User, Ticket, Reply
from auth import hash_password


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(User).first():
        print("Database already seeded.")
        db.close()
        return

    now = datetime.now(timezone.utc)

    # Users
    admin = User(email="admin@helpdesk.ua", name="Адміністратор", password_hash=hash_password("admin123"), role="admin")
    op1 = User(email="zhygailo@helpdesk.ua", name="Жигайло В.М.", password_hash=hash_password("operator123"), role="operator")
    op2 = User(email="moroz@helpdesk.ua", name="Мороз О.С.", password_hash=hash_password("operator123"), role="operator")
    op3 = User(email="demchenko@helpdesk.ua", name="Демченко К.І.", password_hash=hash_password("operator123"), role="operator")
    user1 = User(email="user@example.com", name="Тестовий Користувач", password_hash=hash_password("user123"), role="user")

    db.add_all([admin, op1, op2, op3, user1])
    db.flush()

    tickets_data = [
        {
            "id": "TK-1041",
            "title": "Не можу увійти в акаунт після зміни пароля",
            "description": "Після зміни пароля система не дозволяє авторизуватись. Спробував скинути пароль — та сама проблема.",
            "request_type": "technical",
            "category": "Авторизація",
            "status": "new",
            "priority": "high",
            "operator_id": op1.id,
            "ai_analyzed": True,
            "ai_category": "Технічна проблема",
            "ai_priority": "high",
            "ai_summary": "Користувач не може авторизуватись після зміни пароля. Можливий збій сесії або кешу токенів.",
            "ai_recommendation": "Перевірити стан сесії, очистити активні токени користувача та запропонувати повторну авторизацію.",
            "created_at": now - timedelta(minutes=2),
        },
        {
            "id": "TK-1040",
            "title": "Оплата пройшла, підписка не активована",
            "description": "Я оплатив підписку, але доступ до преміум-функцій не активувався.",
            "request_type": "payment",
            "category": "Оплата",
            "status": "progress",
            "priority": "high",
            "operator_id": op2.id,
            "ai_analyzed": True,
            "ai_category": "Оплата / підписка",
            "ai_priority": "high",
            "ai_summary": "Користувач сплатив підписку, але доступ до преміум-функцій не активувався. Вірогідно, збій webhook від платіжної системи.",
            "ai_recommendation": "Перевірити статус транзакції в Stripe, вручну активувати підписку або запустити re-sync.",
            "created_at": now - timedelta(minutes=18),
        },
        {
            "id": "TK-1039",
            "title": "Як завантажити архів моїх даних?",
            "description": "Хочу отримати архів усіх своїх даних згідно з GDPR.",
            "request_type": "consultation",
            "category": "Консультація",
            "status": "new",
            "priority": "low",
            "operator_id": None,
            "ai_analyzed": True,
            "ai_category": "Консультація",
            "ai_priority": "low",
            "ai_summary": "Запит на експорт персональних даних відповідно до вимог GDPR.",
            "ai_recommendation": "Надати посилання на розділ налаштувань для запиту архіву даних або виконати запит вручну через адмін-панель.",
            "created_at": now - timedelta(minutes=34),
        },
        {
            "id": "TK-1038",
            "title": "Помилка 500 при завантаженні файлу",
            "description": "При спробі завантажити PDF-файл більше 10 МБ отримую помилку 500.",
            "request_type": "technical",
            "category": "Технічна",
            "status": "progress",
            "priority": "medium",
            "operator_id": op3.id,
            "ai_analyzed": True,
            "ai_category": "Технічна проблема",
            "ai_priority": "medium",
            "ai_summary": "Помилка сервера при завантаженні великих файлів (>10 МБ). Можливо, перевищено ліміт розміру завантаження.",
            "ai_recommendation": "Перевірити налаштування max_upload_size на сервері та логи помилок за відповідний час.",
            "created_at": now - timedelta(hours=1),
        },
        {
            "id": "TK-1037",
            "title": "Запит на повернення коштів за квітень",
            "description": "Прошу повернути кошти за квітень, оскільки не користувався сервісом.",
            "request_type": "payment",
            "category": "Оплата",
            "status": "done",
            "priority": "medium",
            "operator_id": op1.id,
            "ai_analyzed": True,
            "ai_category": "Оплата / підписка",
            "ai_priority": "medium",
            "ai_summary": "Запит на рефанд за місяць через невикористання сервісу.",
            "ai_recommendation": "Перевірити активність акаунту за квітень. Якщо сервіс дійсно не використовувався, обробити рефанд згідно з політикою повернень.",
            "created_at": now - timedelta(hours=3),
        },
    ]

    for t_data in tickets_data:
        ticket = Ticket(**t_data, user_id=user1.id)
        db.add(ticket)

    db.flush()

    reply = Reply(
        ticket_id="TK-1040",
        author_id=op2.id,
        content="Доброго дня! Ми перевірили вашу транзакцію — оплата підтверджена. Активуємо підписку вручну, це займе до 5 хвилин.",
        is_operator=True,
    )
    db.add(reply)

    db.commit()
    print("Database seeded successfully!")
    print("\nDemo accounts:")
    print("  Admin:    admin@helpdesk.ua / admin123")
    print("  Operator: zhygailo@helpdesk.ua / operator123")
    print("  User:     user@example.com / user123")
    db.close()


if __name__ == "__main__":
    seed()
