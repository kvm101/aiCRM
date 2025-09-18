import streamlit as st
import requests
from datetime import datetime

BASE_URL = "http://localhost:8081/mail/reminder"

def scheduler(cookies: dict = None):
    st.set_page_config(page_title="Нагадування", page_icon="📧", layout="centered")
    st.title("📧 Створити нагадування поштою")

    # ===== Cookie user_id =====
    if not cookies or "user_id" not in cookies:
        user_id = "1"
        cookies = {"user_id": user_id}

    # ===== Форма нагадування =====
    with st.form("reminder_form"):
        subject = st.text_input("Тема листа")
        text = st.text_area("Текст нагадування")
        date = st.date_input("Дата нагадування", min_value=datetime.now().date())
        time = st.time_input("Час нагадування", value=datetime.now().time())
        submitted = st.form_submit_button("Надіслати нагадування")

        if submitted:
            when = datetime.combine(date, time)
            payload = {
                "subject": subject,
                "text": text,
                "when": when.isoformat()
            }
            try:
                resp = requests.post(
                    BASE_URL,
                    json=payload,
                    cookies=cookies,
                    timeout=5
                )
                resp.raise_for_status()
                st.success("Нагадування успішно створено та відправлено!")
            except requests.RequestException as e:
                st.error(f"Помилка при відправленні нагадування: {e}")
