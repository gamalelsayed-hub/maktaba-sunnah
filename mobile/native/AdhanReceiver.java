package org.waqf.maktabasunnah;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

/** يستقبل منبّه الأذان فيشغّل خدمة الأذان،  */
public class AdhanReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent in) {
        if (!AdhanScheduler.ACTION.equals(in.getAction())) return;
        Intent s = new Intent(c, AdhanService.class);
        s.putExtras(in);
        try {
            ContextCompat.startForegroundService(c, s);
        } catch (Exception e) {
            // إن منع النظام تشغيل الخدمة: إشعار بقناة الأذان (بصوت الأذان كتنبيه)
            boolean fajr = in.getBooleanExtra("fajr", false);
            Intent open = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
            PendingIntent pi = PendingIntent.getActivity(c, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            Notification n = new NotificationCompat.Builder(c, fajr ? "adhan_fajr" : "adhan")
                .setContentTitle(in.getStringExtra("title")).setContentText(in.getStringExtra("body"))
                .setSmallIcon(R.drawable.ic_stat_notify).setContentIntent(pi).setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_MAX).build();
            ((NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE)).notify(7100, n);
        }
    }
}
