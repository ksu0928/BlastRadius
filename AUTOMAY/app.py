import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import os
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

# ================= LOAD ENV =================
load_dotenv()

# ================= PAGE CONFIG =================
st.set_page_config(
    page_title="AutoMA - AI Business Growth System",
    layout="wide"
)

# ================= SIDEBAR =================
st.sidebar.title("AutoMA")
st.sidebar.markdown("AI Business Growth System")
st.sidebar.markdown("Upload → Insights → Action")
st.sidebar.markdown("---")
st.sidebar.markdown("Kushal Mahesh Handigund")

# ================= HEADER =================
st.title("AutoMA - AI Business Growth System")

st.info("""
Upload your business data → get insights → take action

AutoMA analyzes your business data and tells you exactly what to do to improve revenue and performance.
""")

st.markdown("---")

# ================= API KEY =================
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    st.error("API key not found. Set OPENAI_API_KEY in environment.")
    st.stop()

os.environ["OPENAI_API_KEY"] = api_key

# ================= FILE UPLOAD =================
st.subheader("Upload Your Data")
uploaded_file = st.file_uploader("Upload CSV or Excel file", type=["csv", "xlsx"])

# ================= CLEAN FUNCTION =================
def clean_text(text):
    return str(text).replace('\xa0', ' ').strip()

# ================= MAIN =================
if uploaded_file:

    try:
        if uploaded_file.name.endswith(".csv"):
            df = pd.read_csv(uploaded_file)
        else:
            df = pd.read_excel(uploaded_file)

        df = df.applymap(lambda x: clean_text(x) if isinstance(x, str) else x)

        st.success("Dataset loaded successfully")

    except Exception as e:
        st.error(f"Error loading file: {e}")
        st.stop()

    st.markdown("---")

    # ================= TABS =================
    tab1, tab2, tab3, tab4 = st.tabs([
        "Dashboard",
        "AI Insights",
        "Simulation",
        "Ask AI"
    ])

    # ================= TAB 1 =================
    with tab1:

        st.subheader("Dataset Preview")
        st.dataframe(df.head())

        st.markdown("---")

        st.subheader("Key Metrics")

        col1, col2, col3 = st.columns(3)

        if 'Sales' in df.columns:
            col1.metric("Total Sales", f"{df['Sales'].sum():,.0f}")

        if 'Profit' in df.columns:
            col2.metric("Total Profit", f"{df['Profit'].sum():,.0f}")

        if 'Quantity' in df.columns:
            col3.metric("Total Quantity", f"{df['Quantity'].sum():,.0f}")

        st.markdown("---")

        st.subheader("Quick Insights")

        insights = []

        try:
            if 'Product' in df.columns and 'Sales' in df.columns:
                top_product = df.groupby('Product')['Sales'].sum().idxmax()
                insights.append(f"Top Product: {top_product}")

            if 'Region' in df.columns and 'Sales' in df.columns:
                best_region = df.groupby('Region')['Sales'].sum().idxmax()
                insights.append(f"Best Region: {best_region}")

        except:
            insights.append("Unable to compute insights")

        for i in insights:
            st.success(i)

        st.markdown("---")

        st.subheader("Visualization")

        numeric_cols = df.select_dtypes(include='number').columns

        if len(numeric_cols) > 0:
            selected_col = st.selectbox("Select metric", numeric_cols)

            fig, ax = plt.subplots()
            df[selected_col].hist()
            ax.set_title(f"{selected_col} Distribution")
            st.pyplot(fig)

    # ================= LLM =================
    llm = ChatOpenAI(
        model="llama-3.1-8b-instant",
        base_url="https://api.groq.com/openai/v1",
        temperature=0
    )

    # ================= TAB 2 =================
    with tab2:

        st.subheader("AI Business Insights")

        st.info("Get structured insights and clear action steps")

        if st.button("Generate Insights"):

            with st.spinner("Analyzing your data..."):

                summary = df.describe().to_string()

                prompt = f"""
You are an expert business analyst.

Analyze the dataset and respond ONLY in this format:

Key Insights:
- Bullet points

Problems:
- Issues in business

Recommendations:
- Clear actions to improve revenue

Keep it simple and actionable.

Dataset:
{summary}
"""

                try:
                    response = llm.invoke(prompt).content
                    response = response.encode('utf-8', 'ignore').decode('utf-8')

                    st.success("AI Analysis Ready")
                    st.markdown(response)

                except Exception as e:
                    st.error(f"AI Error: {e}")

    # ================= TAB 3 =================
    with tab3:

        st.subheader("What-If Simulation")

        if 'Sales' in df.columns:

            change = st.slider("Change Sales (%)", -50, 50, 0)

            simulated_sales = df['Sales'] * (1 + change / 100)
            st.metric("Simulated Sales", f"{simulated_sales.sum():,.0f}")

            if 'Profit' in df.columns:
                simulated_profit = df['Profit'] * (1 + change / 100)
                st.metric("Simulated Profit", f"{simulated_profit.sum():,.0f}")

        else:
            st.warning("Sales column required")

    # ================= TAB 4 =================
    with tab4:

        st.subheader("Ask AI")

        user_query = st.text_input("Ask a business question")

        if user_query:

            with st.spinner("Processing..."):

                prompt = f"""
Dataset Summary:
{df.describe().to_string()}

Question:
{user_query}

Answer clearly for a business owner with actionable advice.
"""

                try:
                    answer = llm.invoke(prompt).content
                    answer = answer.encode('utf-8', 'ignore').decode('utf-8')

                    st.success(answer)

                except Exception as e:
                    st.error(f"Error: {e}")

else:
    st.info("Upload your dataset to begin")

# ================= FOOTER =================
st.markdown("---")
st.markdown("Upload your data → get insights → take action")