"""Tests for AI service — fallback analysis and async analyze_ticket."""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from services.ai_service import _fallback_analysis, analyze_ticket
from schemas import AiAnalysis


# ── _fallback_analysis ────────────────────────────────────────────────────────

def test_fallback_payment_keywords():
    result = _fallback_analysis("Проблема з оплатою", "Не можу провести оплату підписки")
    assert result.category == "Оплата / підписка"
    assert result.priority == "high"


def test_fallback_auth_keywords():
    result = _fallback_analysis("Не можу увійти", "Проблема з авторизацією та паролем")
    assert result.category == "Технічна проблема"
    assert result.priority == "high"


def test_fallback_bug_keywords():
    result = _fallback_analysis("Помилка 500", "Сайт не працює, збій системи")
    assert result.category == "Технічна проблема"
    assert result.priority == "medium"


def test_fallback_complaint_keywords():
    result = _fallback_analysis("Скарга", "Я незадоволений якістю обслуговування")
    assert result.category == "Скарга"
    assert result.priority == "medium"


def test_fallback_consultation_keywords():
    result = _fallback_analysis("Як налаштувати", "Підкажіть, будь ласка, як використовувати сервіс")
    assert result.category == "Консультація"
    assert result.priority == "low"


def test_fallback_no_keywords_returns_default():
    result = _fallback_analysis("Random title", "Something completely unrelated content")
    assert result.category == "Інше"
    assert result.priority == "medium"
    assert isinstance(result.summary, str)
    assert isinstance(result.recommendation, str)


def test_fallback_returns_ai_analysis_instance():
    result = _fallback_analysis("Test", "Test description")
    assert isinstance(result, AiAnalysis)


# ── analyze_ticket (async) ────────────────────────────────────────────────────

def test_analyze_ticket_no_api_key_uses_fallback():
    """With empty API key, falls back to keyword analysis."""
    import importlib, config
    config.settings.anthropic_api_key = ""

    result = asyncio.run(
        analyze_ticket("Проблема з оплатою", "Платіж не проходить", "payment")
    )
    assert isinstance(result, AiAnalysis)
    assert result.priority in ("high", "medium", "low")


def test_analyze_ticket_api_exception_uses_fallback():
    """When API call raises an exception, fallback is used."""
    with patch("services.ai_service.settings") as mock_settings:
        mock_settings.anthropic_api_key = "fake-key"
        mock_client = AsyncMock()
        mock_client.messages.create.side_effect = Exception("API Error")
        with patch("anthropic.AsyncAnthropic", return_value=mock_client):
            result = asyncio.run(
                analyze_ticket("Test", "Description", "technical")
            )
    assert isinstance(result, AiAnalysis)


def test_analyze_ticket_api_success():
    """When API returns valid JSON, parses it correctly."""
    import json
    fake_response = MagicMock()
    fake_response.content = [MagicMock(text=json.dumps({
        "category": "Технічна проблема",
        "priority": "high",
        "summary": "Test summary",
        "recommendation": "Test recommendation",
    }))]
    with patch("services.ai_service.settings") as mock_settings:
        mock_settings.anthropic_api_key = "fake-key"
        mock_client = AsyncMock()
        mock_client.messages.create = AsyncMock(return_value=fake_response)
        with patch("anthropic.AsyncAnthropic", return_value=mock_client):
            result = asyncio.run(
                analyze_ticket("Test", "Description", "technical")
            )
    assert result.category == "Технічна проблема"
    assert result.priority == "high"
    assert result.summary == "Test summary"
