package org.waqf.maktabasunnah;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

/** حفظ مواعيد الأذان وجدولتها في AlarmManager (وتُعاد بعد إعادة تشغيل الجوال) */
public class AdhanScheduler {
    static final String ACTION = "org.waqf.maktabasunnah.ADHAN";
    static SharedPreferences prefs(Context c) { return c.getSharedPreferences("adhan", Context.MODE_PRIVATE); }
    static void save(Context c, String json) { prefs(c).edit().putString("items", json).apply(); }

    static boolean canExact(Context c) {
        if (Build.VERSION.SDK_INT < 31) return true;
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        return am.canScheduleExactAlarms();
    }

    static PendingIntent pi(Context c, JSONObject o, int flags) {
        Intent i = new Intent(c, AdhanReceiver.class).setAction(ACTION);
        i.putExtra("title", o.optString("title", "🕌 الأذان"));
        i.putExtra("body", o.optString("body", ""));
        i.putExtra("fajr", o.optBoolean("fajr", false));
        return PendingIntent.getBroadcast(c, 70000 + o.optInt("id", 0), i, flags | PendingIntent.FLAG_IMMUTABLE);
    }

    static JSONArray items(Context c) {
        try { return new JSONArray(prefs(c).getString("items", "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    static void cancelAll(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        JSONArray a = items(c);
        for (int k = 0; k < a.length(); k++) {
            JSONObject o = a.optJSONObject(k); if (o == null) continue;
            PendingIntent p = pi(c, o, PendingIntent.FLAG_NO_CREATE);
            if (p != null) { am.cancel(p); p.cancel(); }
        }
    }

    static int scheduleAll(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        JSONArray a = items(c);
        long now = System.currentTimeMillis();
        boolean exact = canExact(c);
        int n = 0;
        for (int k = 0; k < a.length(); k++) {
            JSONObject o = a.optJSONObject(k); if (o == null) continue;
            long at = o.optLong("at", 0);
            if (at <= now) continue;
            PendingIntent p = pi(c, o, PendingIntent.FLAG_UPDATE_CURRENT);
            try {
                if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, p);
                else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, p);
                n++;
            } catch (Exception ignored) { }
        }
        return n;
    }
}
