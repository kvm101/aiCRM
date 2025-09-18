import streamlit as st
import requests
from datetime import datetime

def profile(cookies: dict = None):
    """
    Відображає профіль користувача, приймаючи cookies як аргумент.
    Очікує у cookies ключ 'user_id'.
    """
    st.set_page_config(page_title="User Profile", page_icon="👤", layout="centered")
    st.title("👤 Профіль користувача")

    # Якщо cookie не передано або немає user_id – даємо можливість ввести вручну
    if not cookies or "user_id" not in cookies:
        user_id = "3"
        cookies = {"user_id": user_id}

    try:
        resp = requests.get(
            "http://localhost:8081/users",
            cookies=cookies,  # використовуємо передані cookies
            timeout=5
        )
        resp.raise_for_status()
        user = resp.json()

        st.subheader("Основна інформація")
        st.markdown(
            f"""
            **Ім’я:** {user.get("name", "—")}  
            **Логін:** {user.get("login", "—")}  
            **Компанія:** {user.get("company", "—")}  
            **Email:** {user.get("email", "—")}  
            **Телефон:** {user.get("phone", "—")}  
            **Роль:** {user.get("role", "—")}
            """
        )

        if "tasks" in user and user["tasks"]:
            st.subheader("Завдання")
            st.table([
                {
                    "ID": t.get("id"),
                    "Назва": t.get("title"),
                    "Дедлайн": t.get("deadline"),
                    "Тег": t.get("tag"),
                    "Опис": t.get("description")
                }
                for t in user["tasks"]
            ])

    except requests.RequestException as e:
        st.error(f"Помилка запиту: {e}")
