import streamlit as st
import requests
from streamlit_cookies_manager import EncryptedCookieManager
from auth.auth_page import auth_page

def profile(cookies: EncryptedCookieManager = None, user_id: str = "1"):
    COOKIES = {"user_id": str(user_id)}
    st.subheader("👤 Профіль користувача")

    try:
        resp = requests.get("http://localhost:8081/users", cookies=COOKIES, timeout=5)
        resp.raise_for_status()
        user = resp.json()

        st.markdown(
            f"""
            **Ім’я:** {user.get("name", "—")}  
            **Логін:** {user.get("login", "—")}  
            **Компанія:** {user.get("company", "—")}  
            **Email:** {user.get("email", "—")}  
            **Телефон:** {user.get("phone", "—")}  
            **Роль:** {user.get("role", "—")}  
            **Останній вхід:** {user.get("lastEnter", "—")}
            """
        )

        if st.button("Вийти"):
            st.session_state.page = "auth"
            if cookies:
                cookies["user_id"] = ""
                cookies.save()

    except requests.RequestException as e:
        st.error(f"Помилка запиту: {e}")
    except ValueError as e:
        st.error(f"Помилка обробки відповіді: {e}")
