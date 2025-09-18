import streamlit as st
from streamlit_option_menu import option_menu

from auth.registration import registration
from auth.login import login


def auth_page(cookies):
    st.title("aiCRM ✦ Auth")
    selected = option_menu(None, ["Ввійти", "Реєстрація"],
                           icons=['bi-person-lines-fill', 'bi-check2-circle'],
                           menu_icon="cast", default_index=0, orientation="horizontal")

    if selected == "Ввійти":
        login(cookies)
    elif selected == "Реєстрація":
        registration()

