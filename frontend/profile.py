import streamlit as st
import requests

def profile(user_id: str = "1"):
    """
    Відображає профіль користувача.
    user_id: str або int, дефолт = "1"
    """
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


    except requests.RequestException as e:
        st.error(f"Помилка запиту: {e}")
    except ValueError as e:
        st.error(f"Помилка обробки відповіді: {e}")


if __name__ == "__main__":
    st.set_page_config(page_title="User Profile", page_icon="👤", layout="centered")
    st.title("aiCRM ✦")
    profile()
