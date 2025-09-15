import streamlit as st
from streamlit_option_menu import option_menu

from clients.clients import clients
from tasks.tasks import tasks
from scheduler.scheduler import scheduler

st.set_page_config(
        page_title="✦ aiCRM",
        page_icon="images/favicon.png",
        layout="centered",
        initial_sidebar_state="auto",
    )

def main():
    st.title("aiCRM ✦")
    selected = option_menu(None, ["Клієнти", "Завдання", "Календар"],
                            icons=['bi-person-lines-fill', 'bi-check2-circle', "bi-scheduler-check"],
                            menu_icon="cast", default_index=0, orientation="horizontal")

    if selected == "Клієнти":
        clients()
    elif selected == "Завдання":
        tasks()
    elif selected == "Календар":
        scheduler()



if __name__ == "__main__":
    main()



