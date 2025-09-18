import requests
import streamlit as st

def login(cookies):
    st.title("Авторизація")

    login_value = st.text_input("Логін", placeholder="Введіть логін")

    password_value = st.text_input("Пароль", placeholder="Введіть пароль", type="password")

    if st.button("Ввійти"):
        url = "http://localhost:8081/auth/login"
        data = {
            "login": login_value,
            "password": password_value
        }

        try:
            response = requests.post(url, json=data)
            st.write("Статус:", response.status_code)
            cookies["user_id"] = "3"
            cookies.save()

            if cookies.get("user_id"):
                st.switch_page(page="main")
            st.write("Відповідь сервера:", response.text)
        except requests.exceptions.RequestException as e:
            st.error(f"Помилка запиту: {e}")