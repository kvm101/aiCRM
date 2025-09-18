import streamlit as st
import streamlit_shadcn_ui as ui
import requests

BASE_URL = "http://localhost:8081/clients"

STATUS_OPTIONS = ["NEW", "IN_WORK", "CLIENT", "ARCHIVED"]
STATUS_MAP = {
    "Нові": "NEW",
    "В роботі": "IN_WORK",
    "Клієнти": "CLIENT",
    "Архівні": "ARCHIVED",
}

def clients(cookies: dict = None):
    st.set_page_config(page_title="Клієнти", page_icon="📇", layout="centered")
    st.title("Мої клієнти")

    if not cookies or "user_id" not in cookies:
        cookies = {"user_id": "1"}

    # ---- Додавання нового клієнта ----
    with st.expander("➕ Додати нового клієнта"):
        with st.form("add_client_form"):
            name = st.text_input("Ім’я")
            company = st.text_input("Компанія")
            email = st.text_input("Email")
            phone = st.text_input("Телефон")
            status = st.selectbox("Статус", STATUS_OPTIONS)
            notes = st.text_area("Нотатки (через крапку з комою)")
            if st.form_submit_button("Додати клієнта"):
                new_client = {
                    "name": name,
                    "company": company,
                    "email": email,
                    "phone": phone,
                    "status": status,
                    "notes": [n.strip() for n in notes.split(";") if n.strip()]
                }
                try:
                    resp = requests.post(BASE_URL, json=new_client, cookies=cookies, timeout=5)
                    resp.raise_for_status()
                    st.success("Клієнта додано!")
                    st.rerun()
                except requests.RequestException as e:
                    st.error(f"Помилка додавання клієнта: {e}")

    # ---- Вкладки по статусах ----
    selected = ui.tabs(options=list(STATUS_MAP.keys()), default_value="Нові", key="status_tabs")
    current_status = STATUS_MAP[selected]

    # ---- Завантаження клієнтів ----
    try:
        resp = requests.get(f"{BASE_URL}/filtered", cookies=cookies, timeout=5)
        resp.raise_for_status()
        all_clients = resp.json()
    except requests.RequestException as e:
        st.error(f"Помилка завантаження клієнтів: {e}")
        return

    filtered = [c for c in all_clients if c.get("status") == current_status]

    # ---- Метрики ----
    cols = st.columns(3)
    cols[0].metric("Загалом клієнтів", str(len(all_clients)))
    cols[1].metric("У вибраному статусі", str(len(filtered)))
    cols[2].metric("Нотаток у статусі", str(sum(len(c.get("notes", [])) for c in filtered)))

    # ---- Вивід клієнтів ----
    for client in filtered:
        st.subheader(f"{client['name']} ({client['company']}) — {client['status']}")
        st.write(f"Email: {client['email']} | Телефон: {client['phone']}")

        # ---- Нотатки ----
        with st.expander(f"📝 Нотатки клієнта #{client['id']}"):
            if client.get("notes"):
                for idx, note in enumerate(client["notes"], start=1):
                    st.markdown(f"**{idx}.** {note}")
            else:
                st.info("Нотаток немає.")

            note_key = f"note_add_{client['id']}"
            if note_key not in st.session_state:
                st.session_state[note_key] = ""

            new_note = st.text_area(
                f"Додати нотатку (#{client['id']})",
                value=st.session_state[note_key],
                key=note_key,
                height=80
            )

            if st.button(f"Зберегти нотатку для #{client['id']}", key=f"save_note_{client['id']}"):
                text = st.session_state[note_key].strip()
                if text:
                    try:
                        requests.patch(
                            f"{BASE_URL}/{client['id']}",
                            json={"notes": [text]},
                            cookies=cookies,
                            timeout=5
                        ).raise_for_status()
                        st.success("Нотатку додано!")
                        st.session_state[note_key] = ""
                        st.rerun()
                    except requests.RequestException as e:
                        st.error(f"Помилка при збереженні нотатки: {e}")

        # ---- Зміна статусу ----
        new_status = st.selectbox(
            "Змінити статус",
            options=STATUS_OPTIONS,
            index=STATUS_OPTIONS.index(client["status"]),
            key=f"status_{client['id']}"
        )
        if st.button(f"Оновити статус {client['id']}", key=f"update_{client['id']}"):
            try:
                requests.patch(
                    f"{BASE_URL}/{client['id']}",
                    json={"status": new_status},
                    cookies=cookies,
                    timeout=5
                ).raise_for_status()
                st.success(f"Статус клієнта {client['name']} змінено на {new_status}")
                st.rerun()
            except requests.RequestException as e:
                st.error(f"Помилка оновлення статусу: {e}")

        # ---- Видалення клієнта ----
        if st.button(f"Видалити клієнта {client['id']}", key=f"del_{client['id']}"):
            try:
                del_resp = requests.delete(f"{BASE_URL}/{client['id']}", cookies=cookies, timeout=5)
                if del_resp.status_code == 204:
                    st.success(f"Клієнта {client['name']} видалено!")
                    st.rerun()
                else:
                    st.error(f"Не вдалося видалити клієнта {client['name']}")
            except requests.RequestException as e:
                st.error(f"Помилка видалення: {e}")

        st.markdown("---")
