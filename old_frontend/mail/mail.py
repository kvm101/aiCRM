import streamlit as st
import requests
from datetime import datetime

BASE_URL = "http://localhost:8081/mail/send"

def mail(cookies: dict = None):
    """
    Сторінка для надсилання листів кільком отримувачам.
    """
    st.set_page_config(page_title="Розсилка", page_icon="📨", layout="centered")
    st.title("📨 Надіслати лист (розсилка)")

    # ===== Cookie user_id =====
    if not cookies or "user_id" not in cookies:
        user_id = "1"
        cookies = {"user_id": user_id}

    with st.form("mail_form"):
        to_raw = st.text_area(
            "Отримувачі (email через кому)",
            placeholder="example1@mail.com, example2@mail.com"
        )
        subject = st.text_input("Тема листа")
        text = st.text_area("Текст повідомлення")
        date = st.date_input("Дата нагадування (необов’язково)", value=datetime.now().date())
        time = st.time_input("Час нагадування (необов’язково)", value=datetime.now().time())

        submitted = st.form_submit_button("Надіслати")

        if submitted:
            recipients = [addr.strip() for addr in to_raw.split(",") if addr.strip()]
            if not recipients:
                st.warning("Вкажіть хоча б один email отримувача.")
                return

            when_dt = datetime.combine(date, time)
            payload = {
                "to": recipients,
                "subject": subject,
                "text": text,
                "when": when_dt.isoformat()
            }

            try:
                resp = requests.post(
                    BASE_URL,
                    json=payload,
                    cookies=cookies,
                    timeout=5
                )
                resp.raise_for_status()
                st.success("Лист успішно надіслано!")
            except requests.RequestException as e:
                st.error(f"Помилка при відправленні: {e}")
