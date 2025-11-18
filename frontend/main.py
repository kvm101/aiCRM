import streamlit as st
from streamlit_option_menu import option_menu

from auth.auth_page import auth_page
from clients.clients import clients
from mail.mail import mail
from profile import profile
from tasks.tasks import tasks
from scheduler.scheduler import scheduler
from streamlit_cookies_manager import EncryptedCookieManager
from dotenv import load_dotenv
from streamlit_cookies_manager import encrypted_cookie_manager
import os

load_dotenv()

cookies = encrypted_cookie_manager.EncryptedCookieManager(
    prefix="aiCRM",
    password=os.getenv("SECRET_COOKIES")
)

st.set_page_config(
        page_title="✦ aiCRM",
        page_icon="images/favicon.png",
        layout="centered",
        initial_sidebar_state="auto",
    )



def main():
    st.title("aiCRM ✦")
    selected = option_menu(None, ["Клієнти", "Завд.", "Нагад.", "Розс.", "Профіль"],
                            icons=['bi-person-lines-fill', 'bi-check2-circle', "bi-calendar-event", "bi-envelope-at-fill", "bi-person-circle"],
                            menu_icon="cast", default_index=0, orientation="horizontal")

    if selected == "Клієнти":
        clients()
    elif selected == "Завд.":
        tasks()
    elif selected == "Нагад.":
        scheduler()
    elif selected == "Розс.":
        mail()
    elif selected == "Профіль":
        profile(cookies=cookies)


if __name__ == "__main__":
    if (not cookies.ready()):
        st.stop()

    user_id = cookies.get("user_id")

    if user_id:
        main()
    else:
        auth_page(cookies)



