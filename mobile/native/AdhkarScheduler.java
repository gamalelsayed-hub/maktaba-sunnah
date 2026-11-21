package org.waqf.maktabasunnah;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import androidx.core.content.ContextCompat;
import org.json.JSONArray;
import org.json.JSONObject;

/** جدولة الأذكار المسموعة: منبّه من النظام في الوقت المختار يشغّل خدمة الأذكار (وتُعاد بعد إعادة تشغيل الجوال) */
public class AdhkarScheduler {
    static final String ACTION = "org.waqf.maktabasunnah.ADHKAR";
    static SharedPreferences prefs(Context c) { return c.getSharedPreferences("adhkar_auto", Context.MODE_PRIVATE); }

    static PendingIntent pi(Context c, JSONObject o, int flags) {
        Intent i = new Intent(c, Receiver.class).setAction(ACTION);
        i.putExtra("kind", o.optString("kind", "sabah"));
        i.putExtra("title", o.optString("title", "📿 الأذكار"));
        return PendingIntent.getBroadcast(c, 72000 + o.optInt("id", 0), i, flags | PendingIntent.FLAG_IMMUTABLE);
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
        boolean exact = AdhanScheduler.canExact(c);
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

    /** يستقبل المنبّه فيشغّل الأذكار؛ وإن منع النظام التشغيل يظهر تذكير عادي */
    public static class Receiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context c, Intent in) {
            if (!ACTION.equals(in.getAction())) return;
            Intent s = new Intent(c, AdhkarService.class);
            s.putExtras(in);
            try { ContextCompat.startForegroundService(c, s); }
            catch (Exception e) {
                Intent open = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
                PendingIntent pi = PendingIntent.getActivity(c, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
                Notification n = new androidx.core.app.NotificationCompat.Builder(c, "reminders")
                    .setContentTitle(in.getStringExtra("title")).setContentText("اضغط للاستماع إلى الأذكار")
                    .setSmallIcon(R.drawable.ic_stat_notify).setContentIntent(pi).setAutoCancel(true).build();
                ((NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE)).notify(7202, n);
            }
        }
    }
}
