import requests
import streamlit as st

def registration():
    st.title("Реєстрація користувача")

    name = st.text_input("ПІБ", placeholder="Прізвище Ім'я По_Батькові")
    login = st.text_input("Логін", placeholder="Логін")
    password = st.text_input("Пароль", type="password", placeholder="Пароль")
    company = st.text_input("Компанія", placeholder="Назва компанії")
    mail = st.text_input("Пошта", placeholder="you@example.com")
    phone = st.text_input("Телефон", placeholder="+(380) 91-34-152-34")
    role = st.selectbox("Роль", ["ADMIN", "USER", "MANAGER"])

    if st.button("Зареєструватися"):
        url = "http://localhost:8081/auth/register"
        data = {
            "name": name,
            "login": login,
            "password": password,
            "company": company,
            "email": mail,
            "phone": phone,
            "role": role,
        }

        try:
            response = requests.post(url, json=data)
            if response.status_code:
                st.success("Успішна реєстрація!")

        except requests.exceptions.RequestException as e:
            st.error(f"Помилка запиту: {e}")

registration()
