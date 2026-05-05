import streamlit as st
import streamlit_shadcn_ui as ui
import requests
import pandas as pd
from datetime import datetime

BASE_URL = "http://localhost:8081/tasks"
STATUS_OPTIONS = ["PLANNED", "IN_WORK", "DONE"]

def tasks(cookies: dict = None):
    st.set_page_config(page_title="Завдання", page_icon="✅", layout="centered")
    st.title("Мої завдання")

    if not cookies or "user_id" not in cookies:
        user_id = "1"
        cookies = {"user_id": user_id}

    try:
        resp = requests.get(BASE_URL, cookies=cookies, timeout=5)
        resp.raise_for_status()
        all_tasks = resp.json()
    except requests.RequestException as e:
        st.error(f"Помилка завантаження завдань: {e}")
        return

    planned = len([t for t in all_tasks if t.get("tag") == "PLANNED"])
    in_work = len([t for t in all_tasks if t.get("tag") == "IN_WORK"])
    done = len([t for t in all_tasks if t.get("tag") == "DONE"])

    cols = st.columns(3)
    cols[0].metric("Заплановано", planned)
    cols[1].metric("У роботі", in_work)
    cols[2].metric("Виконано", done)

    with st.expander("➕ Додати нове завдання"):
        with st.form("add_task"):
            title = st.text_input("Назва")
            description = st.text_area("Опис")
            deadline = st.date_input("Дедлайн")
            time_deadline = st.time_input("Час дедлайну")
            tag = st.selectbox("Статус", STATUS_OPTIONS)
            submit = st.form_submit_button("Створити")

            if submit:
                deadline_dt = datetime.combine(deadline, time_deadline)
                new_task = {
                    "title": title,
                    "description": description,
                    "deadline": deadline_dt.isoformat(),
                    "tag": tag
                }
                try:
                    r = requests.post(BASE_URL, json=new_task, cookies=cookies, timeout=5)
                    r.raise_for_status()
                    st.success("Завдання створено!")
                    st.rerun()
                except requests.RequestException as e:
                    st.error(f"Помилка створення: {e}")

    if not all_tasks:
        st.info("Завдань поки немає.")
        return

    for task in all_tasks:
        with st.container():
            st.subheader(f"{task['title']} (#{task['id']})")
            st.write(f"Опис: {task.get('description','—')}")
            if task.get("deadline"):
                st.write("Дедлайн:", task["deadline"])
            st.write("Статус:", task.get("tag","—"))

            current_tag = task.get("tag", "PLANNED")
            if current_tag not in STATUS_OPTIONS:
                current_tag = "PLANNED"

            new_tag = st.selectbox(
                f"Змінити статус (#{task['id']})",
                STATUS_OPTIONS,
                index=STATUS_OPTIONS.index(current_tag),
                key=f"tag_{task['id']}"
            )

            if st.button(f"Оновити #{task['id']}", key=f"upd_{task['id']}"):
                updated = {
                    "id": task["id"],
                    "title": task["title"],
                    "description": task.get("description"),
                    "deadline": task.get("deadline"),
                    "tag": new_tag
                }
                try:
                    r = requests.put(f"{BASE_URL}/{task['id']}", json=updated, cookies=cookies, timeout=5)
                    r.raise_for_status()
                    st.success("Оновлено!")
                    st.rerun()

                except requests.RequestException as e:
                    st.error(f"Помилка оновлення: {e}")

            if st.button(f"Видалити #{task['id']}", key=f"del_{task['id']}"):
                try:
                    r = requests.delete(f"{BASE_URL}/{task['id']}", cookies=cookies, timeout=5)
                    if r.status_code == 204:
                        st.success("Видалено!")
                        st.rerun()
                    else:
                        st.error("Не вдалося видалити")
                except requests.RequestException as e:
                    st.error(f"Помилка видалення: {e}")

            st.markdown("---")
