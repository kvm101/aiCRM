import streamlit as st
import streamlit_shadcn_ui as ui
import pandas as pd


def clients():
    cols = st.columns(3)
    with cols[0]:
        ui.metric_card(title="Кількість за місяць", content="$45,231.89", description="+20.1% from last month", key="card1")
    with cols[1]:
        ui.metric_card(title="Кількість ", content="$45,231.89", description="+20.1% from last month", key="card2")
    with cols[2]:
        ui.metric_card(title="Total Revenue", content="$45,231.89", description="+20.1% from last month", key="card3")

    st.title("Мої клієнти")

    selected = ui.tabs(options=['Нові', 'В роботі', 'Клієнти', 'Архівні'], default_value='Нові', key="kanaries")

    if selected == "Нові":
        switch_value = ui.switch(default_checked=True, label="Toggle Switch", key="switch1")
        st.write("Режим редагування:", ":green[Так]" if switch_value else ":red[Ні]")

        df = pd.DataFrame(
            [
                {"command": "st.selectbox", "rating": 4, "is_widget": True},
                {"command": "st.balloons", "rating": 5, "is_widget": False},
                {"command": "st.time_input", "rating": 3, "is_widget": True},
            ]
        )
        edited_df = st.data_editor(
            df,
            num_rows="dynamic" if switch_value else "fixed",
            column_config={
                "command": "Streamlit Command",
                "rating": st.column_config.NumberColumn(
                    "Your rating",
                    help="How much do you like this command (1-5)?",
                    min_value=1,
                    max_value=5,
                    step=1,
                    format="%d ⭐",
                ),
                "is_widget": "Widget ?",
            },
            disabled=["command", "is_widget"],
            hide_index=True,
        )

        favorite_command = edited_df.loc[edited_df["rating"].idxmax()]["command"]
        st.markdown(f"Your favorite command is **{favorite_command}** 🎈")
