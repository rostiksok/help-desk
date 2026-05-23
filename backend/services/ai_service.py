import json
import anthropic
from config import settings
from schemas import AiAnalysis

_SYSTEM_PROMPT = """Ти — AI-асистент служби підтримки. Проаналізуй звернення користувача та поверни JSON з такими полями:
- category (string): одна з категорій: "Технічна проблема", "Оплата / підписка", "Консультація", "Скарга", або інша доречна
- priority (string): "high", "medium" або "low"
- summary (string): стислий опис проблеми (1-2 речення, українською)
- recommendation (string): рекомендована дія для оператора (1-3 речення, українською)

Правила визначення пріоритету:
- high: проблеми з оплатою, неможливість увійти, втрата доступу, критичні помилки
- medium: технічні баги, довга обробка, часткові проблеми
- low: консультації, загальні питання, запити на інформацію

Поверни ЛИШЕ валідний JSON без додаткового тексту."""

# Keyword-based fallback when API key is absent/invalid
_KEYWORD_RULES = [
    (["оплат", "підписк", "платіж", "повернен", "рефанд", "stripe", "гроші"],
     "Оплата / підписка", "high",
     "Звернення стосується питань оплати або підписки.",
     "Перевірити статус транзакції та підписки в платіжній системі."),
    (["увійти", "авториз", "пароль", "логін", "акаунт", "доступ"],
     "Технічна проблема", "high",
     "Проблема з авторизацією або доступом до акаунту.",
     "Перевірити статус акаунту, скинути сесію та запропонувати скидання пароля."),
    (["помилк", "500", "404", "не працює", "збій", "баг", "crash"],
     "Технічна проблема", "medium",
     "Технічна помилка в роботі системи.",
     "Перевірити логи сервера та відтворити помилку для діагностики."),
    (["скарг", "незадоволен", "погано", "жахливо", "обурен"],
     "Скарга", "medium",
     "Скарга на якість обслуговування або роботу сервісу.",
     "Вибачитись за незручності та запропонувати рішення або компенсацію."),
    (["як", "поясн", "допоможіть", "підкаж", "консульт", "інструкц"],
     "Консультація", "low",
     "Запит на консультацію або інформацію.",
     "Надати детальну відповідь або посилання на відповідний розділ довідки."),
]


def _fallback_analysis(title: str, description: str) -> AiAnalysis:
    text = (title + " " + description).lower()
    for keywords, category, priority, summary, recommendation in _KEYWORD_RULES:
        if any(kw in text for kw in keywords):
            return AiAnalysis(
                category=category, priority=priority,
                summary=summary, recommendation=recommendation,
            )
    return AiAnalysis(
        category="Інше", priority="medium",
        summary="Звернення потребує ручного розгляду оператором.",
        recommendation="Ознайомитись з описом та визначити категорію та пріоритет вручну.",
    )


async def analyze_ticket(title: str, description: str, request_type: str) -> AiAnalysis:
    if settings.anthropic_api_key:
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        user_message = f"Тема: {title}\nТип запиту: {request_type}\nОпис: {description}"
        try:
            response = await client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=512,
                system=_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}],
            )
            raw = response.content[0].text.strip()
            data = json.loads(raw)
            return AiAnalysis(
                category=data["category"],
                priority=data["priority"],
                summary=data["summary"],
                recommendation=data["recommendation"],
            )
        except Exception:
            pass  # fall through to keyword-based fallback

    return _fallback_analysis(title, description)
