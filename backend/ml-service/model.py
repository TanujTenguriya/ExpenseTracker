import os
import json
import hashlib
import joblib
import numpy as np
import pandas as pd
from prophet import Prophet
from sklearn.ensemble import IsolationForest

MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

# Categories are matched case-insensitively. Anything not listed here is
# "neutral" instead of being silently dropped from the necessary/discretionary split 
NECESSARY_CATEGORIES = {
    "groceries", "utilities", "health", "rent", "insurance",
    "education", "transport", "medical", "bills",
}
DISCRETIONARY_CATEGORIES = {
    "shopping", "entertainment", "travel", "dining", "subscriptions",
    "eating out", "leisure", "food delivery",
}

MIN_MONTHS_FOR_PROPHET = 4
MIN_ROWS_FOR_ANOMALY = 8


def get_model_path(user_id):
    return os.path.join(MODEL_DIR, f"user_{user_id}.pkl")


def get_meta_path(user_id):
    return os.path.join(MODEL_DIR, f"user_{user_id}_meta.json")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clean_dates(df):
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    try:
        if pd.api.types.is_datetime64tz_dtype(df["date"]):
            df["date"] = df["date"].dt.tz_localize(None)
    except Exception:
        pass
    df = df.dropna(subset=["date", "amount"])
    return df


def _monthly_series(df):
    return (
        df.groupby(pd.Grouper(key="date", freq="ME"))["amount"]
        .sum()
        .reset_index()
        .rename(columns={"date": "ds", "amount": "y"})
    )


def _fingerprint(df_monthly):
    """Cheap signature of the training data so Prophet is only refit when the
    monthly series has actually changed, instead of on every single request"""
    payload = f"{len(df_monthly)}|{df_monthly['y'].sum():.2f}|{df_monthly['ds'].max()}"
    return hashlib.md5(payload.encode()).hexdigest()


def _classify_category(category):
    key = str(category).strip().lower()
    if key in NECESSARY_CATEGORIES:
        return "necessary"
    if key in DISCRETIONARY_CATEGORIES:
        return "discretionary"
    return "neutral"


def _trend_from_series(values, rel_threshold=0.07):
    """Classify trend from the slope of a linear fit relative to the average
    spend level, rather than comparing a single predicted month to a single
    last actual month (which is noisy and easily flipped by one big purchase)."""
    n = len(values)
    if n < 2:
        return "insufficient_data", 0.0
    x = np.arange(n)
    slope, _ = np.polyfit(x, values, 1)
    avg_level = np.mean(values) or 1.0
    rel_slope = slope / avg_level
    if rel_slope > rel_threshold:
        return "increasing", rel_slope
    if rel_slope < -rel_threshold:
        return "decreasing", rel_slope
    return "stable", rel_slope


# ---------------------------------------------------------------------------
# Prophet: train / cache
# ---------------------------------------------------------------------------

def train_model(df, user_id, force=False):
    """Train (or load a cached) Prophet model on the user's monthly spend.
    Only refits when the underlying monthly series has changed since the
    last save, tracked via a small fingerprint + metadata file."""
    try:
        df = _clean_dates(df)
        df_monthly = _monthly_series(df)

        if len(df_monthly) < MIN_MONTHS_FOR_PROPHET:
            return None, df_monthly

        df_monthly["y"] = df_monthly["y"].astype(float)
        fp = _fingerprint(df_monthly)

        meta_path = get_meta_path(user_id)
        model_path = get_model_path(user_id)

        if not force and os.path.exists(meta_path) and os.path.exists(model_path):
            try:
                with open(meta_path) as f:
                    meta = json.load(f)
                if meta.get("fingerprint") == fp:
                    return joblib.load(model_path), df_monthly
            except Exception:
                pass  # cache unreadable/corrupt -> fall through and retrain

        model = Prophet(
            yearly_seasonality=len(df_monthly) >= 24,
            weekly_seasonality=False,
            daily_seasonality=False,
            seasonality_mode="additive",
            interval_width=0.8,
        )
        model.fit(df_monthly)

        joblib.dump(model, model_path)
        with open(meta_path, "w") as f:
            json.dump({"fingerprint": fp, "n_months": len(df_monthly)}, f)

        return model, df_monthly

    except Exception as e:
        print("TRAIN ERROR:", e)
        return None, None


# ---------------------------------------------------------------------------
# Forecast + trend
# ---------------------------------------------------------------------------

def forecast_with_model(df, user_id):
    try:
        model, df_monthly = train_model(df, user_id)

        if df_monthly is None or df_monthly.empty:
            return None

        values = df_monthly["y"].astype(float).values
        trend, rel_slope = _trend_from_series(values)

        if model is None:
            # Not enough history for Prophet: use a trend-adjusted linear
            # projection instead of a flat historical average.
            n = len(values)
            if n == 1:
                predicted = float(values[-1])
            else:
                x = np.arange(n)
                slope, intercept = np.polyfit(x, values, 1)
                predicted = float(intercept + slope * n)
                last_actual = float(values[-1])
                # guard against wild extrapolation on very short/noisy series
                if predicted < 0 or abs(predicted - last_actual) > last_actual * 1.5 + 1:
                    predicted = last_actual * (1 + rel_slope)

            return {
                "predicted_next_month": round(max(predicted, 0.0), 2),
                "confidence_range": None,
                "trend": trend,
                "trend_strength_pct": round(rel_slope * 100, 1),
                "method": "linear_fallback",
            }

        future = model.make_future_dataframe(periods=1, freq="ME")
        forecast = model.predict(future)
        next_pred = forecast.iloc[-1]

        predicted_value = max(float(next_pred["yhat"]), 0.0)
        lower = max(float(next_pred["yhat_lower"]), 0.0)
        upper = max(float(next_pred["yhat_upper"]), 0.0)

        return {
            "predicted_next_month": round(predicted_value, 2),
            "confidence_range": [round(lower, 2), round(upper, 2)],
            "trend": trend,
            "trend_strength_pct": round(rel_slope * 100, 1),
            "method": "prophet",
        }

    except Exception as e:
        print("FORECAST ERROR:", e)
        return None


# ---------------------------------------------------------------------------
# Anomaly detection (contextual, per-category)
# ---------------------------------------------------------------------------

def _detect_anomalies(df):
    """Flag transactions that are unusual *for their category*, using
    IsolationForest over amount + category-relative z-score + calendar
    features, rather than raw amount alone."""
    if len(df) < MIN_ROWS_FOR_ANOMALY:
        return []

    work = df.copy()
    cat_stats = work.groupby("category")["amount"].agg(["mean", "std"]).fillna(0)
    work = work.join(
        cat_stats.rename(columns={"mean": "cat_mean", "std": "cat_std"}), on="category"
    )
    global_std = work["amount"].std() or 1.0
    work["cat_std"] = work["cat_std"].replace(0, global_std)
    work["z_in_category"] = (work["amount"] - work["cat_mean"]) / work["cat_std"]
    work["day_of_week"] = pd.to_datetime(work["date"]).dt.dayofweek
    work["cat_freq"] = work["category"].map(work["category"].value_counts(normalize=True))

    features = work[["amount", "z_in_category", "day_of_week", "cat_freq"]].fillna(0)

    contamination = min(0.15, max(0.03, 3 / len(work)))
    try:
        clf = IsolationForest(contamination=contamination, random_state=42)
        work["anomaly"] = clf.fit_predict(features)
    except Exception as e:
        print("ANOMALY ERROR:", e)
        return []

    flagged = []
    for _, row in work[work["anomaly"] == -1].iterrows():
        flagged.append({
            "date": str(pd.to_datetime(row["date"]).date()),
            "category": row["category"],
            "amount": float(row["amount"]),
        })
    return flagged


# ---------------------------------------------------------------------------
# Category month-over-month comparison
# ---------------------------------------------------------------------------

def _category_month_over_month(df):
    """Compare each category's most recent calendar month to its own trailing
    history."""
    work = df.copy()
    work["month"] = pd.to_datetime(work["date"]).dt.to_period("M")
    pivot = work.groupby(["month", "category"])["amount"].sum().unstack(fill_value=0)

    if len(pivot) < 2:
        return []

    latest_month = pivot.index.max()
    history = pivot.loc[pivot.index < latest_month]
    current = pivot.loc[latest_month]

    insights = []
    for category in current.index:
        cur_val = current[category]
        if cur_val <= 0:
            continue
        hist_vals = history[category] if category in history.columns else pd.Series(dtype=float)
        hist_vals = hist_vals[hist_vals > 0]

        if len(hist_vals) >= 2:
            mean, std = hist_vals.mean(), hist_vals.std()
            std = std if std > 0 else mean * 0.15  # small baseline variance
            z = (cur_val - mean) / std
            pct_change = ((cur_val - mean) / mean * 100) if mean > 0 else 0
            if z > 1.5 and pct_change > 20:
                insights.append(
                    f"⚠️ {category} spending is up {pct_change:.0f}% vs your usual "
                    f"(₹{cur_val:.0f} vs ~₹{mean:.0f})"
                )
        elif len(hist_vals) == 1:
            prev = hist_vals.iloc[0]
            pct_change = ((cur_val - prev) / prev * 100) if prev > 0 else 0
            if pct_change > 40:
                insights.append(f"⚠️ {category} spending jumped {pct_change:.0f}% vs last month")
    return insights


# ---------------------------------------------------------------------------
# Main analysis
# ---------------------------------------------------------------------------

def analyze_expenses(df, user_id):
    if df is None or df.empty:
        return {"insights": [], "score": 100, "status": "No Data", "forecast": None}

    df = _clean_dates(df)
    if df.empty:
        return {"insights": [], "score": 100, "status": "No Data", "forecast": None}

    insights = []

    total = float(df["amount"].sum())
    avg = float(df["amount"].mean())
    std = float(df["amount"].std()) if len(df) > 1 else 0.0
    cv = (std / avg) if avg > 0 else 0.0  # coefficient of variation -> volatility

    # ---- category-aware month-over-month comparison ----
    insights.extend(_category_month_over_month(df))

    # ---- contextual anomaly detection ----
    anomalies = _detect_anomalies(df)
    if anomalies:
        preview = ", ".join(f"₹{a['amount']:.0f} ({a['category']})" for a in anomalies[:3])
        more = f" +{len(anomalies) - 3} more" if len(anomalies) > 3 else ""
        insights.append(f"🚨 Unusual transactions detected: {preview}{more}")

    # ---- necessary vs discretionary, per-category classification ----
    classes = df["category"].map(_classify_category)
    necessary_spend = float(df.loc[classes == "necessary", "amount"].sum())
    discretionary_spend = float(df.loc[classes == "discretionary", "amount"].sum())
    neutral_spend = float(df.loc[classes == "neutral", "amount"].sum())
    discretionary_ratio = discretionary_spend / total if total > 0 else 0

    if discretionary_spend > necessary_spend and discretionary_spend > 0:
        insights.append(
            f"💡 Discretionary spending (₹{discretionary_spend:.0f}) currently exceeds "
            f"necessary spending (₹{necessary_spend:.0f})"
        )
    if discretionary_spend > 0:
        savings = round(discretionary_spend * 0.2, 2)
        insights.append(f"💰 Cutting discretionary spend by 20% would save roughly ₹{savings:.0f}")

    # ---- forecast ----
    forecast_data = forecast_with_model(df, user_id)
    if forecast_data and forecast_data.get("predicted_next_month") is not None:
        pred = forecast_data["predicted_next_month"]
        rng = forecast_data.get("confidence_range")
        if rng:
            insights.append(
                f"📈 Next month's spend is projected at ₹{pred:.0f} "
                f"(likely between ₹{rng[0]:.0f}-₹{rng[1]:.0f})"
            )
        else:
            insights.append(f"📈 Next month's spend is projected at ₹{pred:.0f}")

        if forecast_data["trend"] == "increasing":
            insights.append(f"📊 Spending trend is rising (~{forecast_data['trend_strength_pct']}% per month)")
        elif forecast_data["trend"] == "decreasing":
            insights.append(f"📉 Spending trend is falling (~{abs(forecast_data['trend_strength_pct'])}% per month)")

    # ---- scoring: multiple weighted factors instead of a few flat -N steps ----
    score = 100.0
    score -= min(discretionary_ratio, 1.0) * 25   # up to -25 for discretionary-heavy spend
    score -= min(cv, 2.0) * 10                     # volatility penalty, capped
    score -= min(len(anomalies), 5) * 4            # -4 per anomaly, capped at -20
    if forecast_data and forecast_data.get("trend") == "increasing":
        score -= min(abs(forecast_data.get("trend_strength_pct", 0)), 30) * 0.5

    score = max(0, min(100, round(score)))

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
        "total_spent": round(total, 2),
        "average_expense": round(avg, 2),
        "volatility_cv": round(cv, 2),
        "necessary_spent": round(necessary_spend, 2),
        "discretionary_spent": round(discretionary_spend, 2),
        "neutral_spent": round(neutral_spend, 2),
        "anomalies": anomalies,
        "score": score,
        "status": status,
        "forecast": forecast_data,
    }