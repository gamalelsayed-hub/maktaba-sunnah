package org.waqf.maktabasunnah;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.SystemClock;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/** ودجت شاشة الجوال الرئيسية: مواقيت الصلاة والصلاة القادمة بعدّ تنازلي حي واختصارات الأذكار */
public class PrayerWidget extends AppWidgetProvider {
    static final String ACT = "org.waqf.maktabasunnah.WIDGET_REFRESH";
    static SharedPreferences prefs(Context c) { return c.getSharedPreferences("widget", Context.MODE_PRIVATE); }

    /** يحفظ مواقيت الأيام القادمة (يحسبها التطبيق) ثم يحدّث الودجت */
    static void save(Context c, String json, String place) {
        prefs(c).edit().putString("times", json).putString("place", place == null ? "" : place).apply();
        refresh(c);
    }

    static JSONArray times(Context c) {
        try { return new JSONArray(prefs(c).getString("times", "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    static void refresh(Context c) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            int[] ids = m.getAppWidgetIds(new ComponentName(c, PrayerWidget.class));
            if (ids == null || ids.length == 0) return;
            long next = 0;
            RemoteViews rv = build(c);
            for (int id : ids) m.updateAppWidget(id, rv);
            next = nextAt(c);
            scheduleNext(c, next);
        } catch (Exception ignored) { }
    }

    static long nextAt(Context c) {
        long now = System.currentTimeMillis();
        JSONArray a = times(c);
        for (int k = 0; k < a.length(); k++) {
            JSONObject o = a.optJSONObject(k);
            if (o != null && o.optLong("at", 0) > now) return o.optLong("at");
        }
        return 0;
    }

    static PendingIntent refreshPi(Context c) {
        Intent i = new Intent(c, PrayerWidget.class).setAction(ACT);
        return PendingIntent.getBroadcast(c, 91000, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** تحديث الودجت بعد دخول الوقت مباشرة ليظهر اسم الصلاة التالية */
    static void scheduleNext(Context c, long at) {
        try {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            long when = at > 0 ? at + 2000 : System.currentTimeMillis() + 3600000L;
            am.setAndAllowWhileIdle(AlarmManager.RTC, when, refreshPi(c));
        } catch (Exception ignored) { }
    }

    static PendingIntent open(Context c, int code, String route) {
        Intent i = new Intent(c, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (route != null) { i.putExtra("route", route); i.setData(Uri.parse("mk://widget/" + code)); }
        return PendingIntent.getActivity(c, 92000 + code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static RemoteViews build(Context c) {
        RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.widget_prayer);
        long now = System.currentTimeMillis();
        JSONArray a = times(c);
        SimpleDateFormat tf = new SimpleDateFormat("h:mm a", new Locale("ar", "SA"));
        int nextIdx = -1;
        for (int k = 0; k < a.length(); k++) { JSONObject o = a.optJSONObject(k); if (o != null && o.optLong("at", 0) > now) { nextIdx = k; break; } }
        int[] nIds = { R.id.wp_n1, R.id.wp_n2, R.id.wp_n3, R.id.wp_n4, R.id.wp_n5 };
        int[] tIds = { R.id.wp_t1, R.id.wp_t2, R.id.wp_t3, R.id.wp_t4, R.id.wp_t5 };
        String place = prefs(c).getString("place", "");
        if (nextIdx < 0) {
            rv.setTextViewText(R.id.wp_next, "افتح التطبيق لتحديث المواقيت");
            rv.setTextViewText(R.id.wp_sub, "حدّد موقعك من «الصلاة» داخل التطبيق");
            rv.setChronometer(R.id.wp_count, SystemClock.elapsedRealtime(), "", false);
            rv.setViewVisibility(R.id.wp_count, android.view.View.GONE);
            for (int i = 0; i < 5; i++) { rv.setTextViewText(nIds[i], ""); rv.setTextViewText(tIds[i], ""); }
        } else {
            JSONObject nx = a.optJSONObject(nextIdx);
            long at = nx.optLong("at");
            rv.setTextViewText(R.id.wp_next, "الصلاة القادمة: " + nx.optString("n"));
            rv.setTextViewText(R.id.wp_sub, tf.format(new Date(at)) + (place.length() > 0 ? " — " + place : ""));
            rv.setViewVisibility(R.id.wp_count, android.view.View.VISIBLE);
            long base = SystemClock.elapsedRealtime() + (at - now);
            if (Build.VERSION.SDK_INT >= 24) rv.setChronometerCountDown(R.id.wp_count, true);
            rv.setChronometer(R.id.wp_count, base, null, true);
            // صلوات اليوم الخمس (يوم الصلاة القادمة) ويُميَّز القادم بالذهبي
            Calendar day = Calendar.getInstance(); day.setTimeInMillis(at);
            int shown = 0;
            for (int k = 0; k < a.length() && shown < 5; k++) {
                JSONObject o = a.optJSONObject(k); if (o == null) continue;
                Calendar d = Calendar.getInstance(); d.setTimeInMillis(o.optLong("at"));
                if (d.get(Calendar.DAY_OF_YEAR) != day.get(Calendar.DAY_OF_YEAR) || d.get(Calendar.YEAR) != day.get(Calendar.YEAR)) continue;
                rv.setTextViewText(nIds[shown], o.optString("n"));
                rv.setTextViewText(tIds[shown], tf.format(new Date(o.optLong("at"))));
                int col = (k == nextIdx) ? 0xFFF5E7B0 : 0xFFFFFFFF;
                rv.setTextColor(tIds[shown], col); rv.setTextColor(nIds[shown], (k == nextIdx) ? 0xFFF5E7B0 : 0xFFCFE8DC);
                shown++;
            }
            for (int i = shown; i < 5; i++) { rv.setTextViewText(nIds[i], ""); rv.setTextViewText(tIds[i], ""); }
        }
        rv.setOnClickPendingIntent(R.id.wp_root, open(c, 0, "#/prayer"));
        rv.setOnClickPendingIntent(R.id.wp_b1, open(c, 1, "#/adhkar/sabah"));
        rv.setOnClickPendingIntent(R.id.wp_b2, open(c, 2, "#/adhkar/masa"));
        rv.setOnClickPendingIntent(R.id.wp_b3, open(c, 3, "#/adhkar/tasbih"));
        return rv;
    }

    @Override public void onUpdate(Context c, AppWidgetManager m, int[] ids) { refresh(c); }

    @Override public void onReceive(Context c, Intent in) {
        super.onReceive(c, in);
        if (in != null && ACT.equals(in.getAction())) refresh(c);
    }

    @Override public void onDisabled(Context c) {
        try { ((AlarmManager) c.getSystemService(Context.ALARM_SERVICE)).cancel(refreshPi(c)); } catch (Exception ignored) { }
    }
}
