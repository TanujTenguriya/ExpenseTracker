import os
import joblib
import pandas as pd
from prophet import Prophet
from sklearn.ensemble import IsolationForest

MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)


def get_model_path(user_id):
    return os.path.join(MODEL_DIR, f"user_{user_id}.pkl")


# ---- TRAIN MODEL ----
def train_model(df, user_id):
    try:
        df = df.copy()

        df = df.dropna(subset=["date", "amount"])
        df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.tz_localize(None)
        df = df.dropna(subset=["date"])

        df_monthly = df.groupby(
            pd.Grouper(key="date", freq="ME")
        )["amount"].sum().reset_index()

        if len(df_monthly) < 2:
            return None

        df_monthly = df_monthly.rename(columns={"date": "ds", "amount": "y"})
        df_monthly["ds"] = pd.to_datetime(df_monthly["ds"]).dt.tz_localize(None)
        df_monthly["y"] = df_monthly["y"].astype(float)

        model = Prophet()
        model.fit(df_monthly)

        joblib.dump(model, get_model_path(user_id))
        return model

    except Exception as e:
        print("TRAIN ERROR:", e)
        return None


# ---- FORECAST + TREND ----
def forecast_with_model(df, user_id):
    try:
        model = train_model(df, user_id)

        if model is None:
            avg = df["amount"].mean()
            return {
                "predicted_next_month": round(avg * 30, 2),
                "confidence_range": None,
                "trend": "insufficient_data"
            }

        # Prepare future
        future = model.make_future_dataframe(periods=1, freq="ME")
        forecast = model.predict(future)
        next_pred = forecast.iloc[-1]

        predicted_value = float(next_pred["yhat"])

        # ---- TREND DETECTION ----
        trend = "stable"

        try:
            df_temp = df.copy()
            df_temp["date"] = pd.to_datetime(df_temp["date"]).dt.tz_localize(None)

            df_monthly = df_temp.groupby(
                pd.Grouper(key="date", freq="ME")
            )["amount"].sum().reset_index()

            if len(df_monthly) >= 1:
                last_actual = df_monthly["amount"].iloc[-1]

                if predicted_value > last_actual:
                    trend = "increasing"
                elif predicted_value < last_actual:
                    trend = "decreasing"

        except Exception as e:
            print("TREND ERROR:", e)

        return {
            "predicted_next_month": predicted_value,
            "confidence_range": [
                float(next_pred["yhat_lower"]),
                float(next_pred["yhat_upper"]),
            ],
            "trend": trend
        }

    except Exception as e:
        print("FORECAST ERROR:", e)
        return None


# ---- MAIN ANALYSIS ----
def analyze_expenses(df, user_id):
    insights = []

    if df.empty:
        return {
            "insights": [],
            "score": 100,
            "status": "No Data",
            "forecast": None
        }

    df = df.copy()

    # ---- BASIC STATS ----
    total = df["amount"].sum()
    avg = df["amount"].mean()
    std = df["amount"].std() if len(df) > 1 else 0

    # ---- CATEGORY BEHAVIOR ----
    category_stats = df.groupby("category")["amount"].agg(["mean", "std", "sum"])
    category_stats["std"] = category_stats["std"].fillna(0)

    recent_df = df.tail(max(3, int(len(df) * 0.3)))
    recent_category = recent_df.groupby("category")["amount"].sum()

    for category in recent_category.index:
        current = recent_category[category]

        if category in category_stats.index:
            mean = category_stats.loc[category, "mean"]
            std_dev = category_stats.loc[category, "std"]

            threshold = mean + 1.5 * std_dev

            if std_dev > 0 and current > threshold:
                insights.append(f"⚠️ Unusual increase in {category} spending")

    # ---- ANOMALY DETECTION ----
    if len(df) >= 5:
        try:
            clf = IsolationForest(contamination=0.1, random_state=42)
            df["anomaly"] = clf.fit_predict(df[["amount"]])

            if (df["anomaly"] == -1).any():
                insights.append("🚨 Unusual transactions detected")
        except Exception as e:
            print("ANOMALY ERROR:", e)

    # ---- NECESSARY VS UNNECESSARY ----
    necessary = ["Groceries", "Utilities", "Health"]
    unnecessary = ["Shopping", "Entertainment", "Travel"]

    necessary_spend = df[df["category"].isin(necessary)]["amount"].sum()
    unnecessary_spend = df[df["category"].isin(unnecessary)]["amount"].sum()

    if unnecessary_spend > necessary_spend:
        insights.append("💡 High non-essential spending")

    if unnecessary_spend > 0:
        savings = int(unnecessary_spend * 0.2)
        insights.append(f"💰 Save approx ₹{savings} by reducing non-essential expenses")

    # ---- FORECAST ----
    forecast_data = forecast_with_model(df, user_id)

    if forecast_data and forecast_data.get("predicted_next_month"):
        insights.append(
            f"📈 Expected next month spending: ₹{round(forecast_data['predicted_next_month'], 2)}"
        )

    # ---- SCORE ----
    score = 100

    if unnecessary_spend > necessary_spend:
        score -= 20

    if len(insights) >= 3:
        score -= 15

    if std > avg:
        score -= 10

    score = max(score, 0)

    if score > 80:
        status = "Excellent"
    elif score > 60:
        status = "Good"
    elif score > 40:
        status = "Needs Improvement"
    else:
        status = "Poor"

    return {
        "insights": insights,
        "total_spent": float(total),
        "average_expense": float(avg),
        "score": score,
        "status": status,
        "forecast": forecast_data
    }