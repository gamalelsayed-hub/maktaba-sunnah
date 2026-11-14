package org.waqf.maktabasunnah;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;

/** يشغّل الأذان كاملاً على صوت «المنبّه» (يُسمع حتى والجوال صامت) مع زر إيقاف في الإشعار */
public class AdhanService extends Service {
    static final String STOP = "org.waqf.maktabasunnah.ADHAN_STOP";
    static final String CH = "adhan_live";
    static final int NID = 7001;
    private MediaPlayer mp;
    private String title = "", body = "";

    @Override public IBinder onBind(Intent i) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && STOP.equals(intent.getAction())) { finish(false); return START_NOT_STICKY; }
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null) {
            NotificationChannel c = new NotificationChannel(CH, "الأذان (تشغيل)", NotificationManager.IMPORTANCE_HIGH);
            c.setSound(null, null);
            c.enableVibration(true);
            c.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(c);
        }
        title = intent != null && intent.getStringExtra("title") != null ? intent.getStringExtra("title") : "🕌 الأذان";
        body = intent != null && intent.getStringExtra("body") != null ? intent.getStringExtra("body") : "";
        boolean fajr = intent != null && intent.getBooleanExtra("fajr", false);

        Intent stop = new Intent(this, AdhanService.class).setAction(STOP);
        PendingIntent sp = PendingIntent.getService(this, 1, stop, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification n = new NotificationCompat.Builder(this, CH)
            .setContentTitle(title).setContentText(body)
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setContentIntent(openApp()).setDeleteIntent(sp)
            .addAction(0, "⏹ إيقاف الأذان", sp)
            .setOngoing(true).setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC).build();
        if (Build.VERSION.SDK_INT >= 29) startForeground(NID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(NID, n);

        release();
        try {
            // الصوت المختار: من الإعدادات (أو من طلب التجربة)، وملفات المستخدم تُحفظ داخل التطبيق
            String voice = intent != null && intent.getStringExtra("voice") != null ? intent.getStringExtra("voice")
                : getSharedPreferences("adhan", MODE_PRIVATE).getString(fajr ? "voice_fajr" : "voice", fajr ? "shayba" : "afasy");
            mp = new MediaPlayer();
            mp.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
            java.io.File custom = new java.io.File(getFilesDir(), fajr ? "adhan_custom_fajr.mp3" : "adhan_custom.mp3");
            if ("custom".equals(voice) && custom.exists()) {
                mp.setDataSource(custom.getAbsolutePath());
            } else {
                String raw = "makkah".equals(voice) ? "adhan_makkah" : "shayba".equals(voice) ? "adhan_fajr" : "afasy".equals(voice) ? "adhan" : (fajr ? "adhan_fajr" : "adhan");
                int res = getResources().getIdentifier(raw, "raw", getPackageName());
                AssetFileDescriptor afd = getResources().openRawResourceFd(res);
                mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                afd.close();
            }
            mp.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK);
            mp.setOnCompletionListener(m -> finish(true));
            mp.setOnErrorListener((m, w, x) -> { finish(true); return true; });
            mp.prepare();
            mp.start();
        } catch (Exception e) { finish(true); }
        return START_NOT_STICKY;
    }

    private PendingIntent openApp() {
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        return PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    /** بعد انتهاء الأذان يبقى إشعار عادي صامت بدخول الوقت */
    private void finish(boolean keepNote) {
        release();
        if (Build.VERSION.SDK_INT >= 24) stopForeground(STOP_FOREGROUND_REMOVE); else stopForeground(true);
        if (keepNote && title.length() > 0) {
            Notification n = new NotificationCompat.Builder(this, CH)
                .setContentTitle(title).setContentText(body)
                .setSmallIcon(R.drawable.ic_stat_notify)
                .setContentIntent(openApp()).setAutoCancel(true).setSilent(true).build();
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NID + 1, n);
        }
        stopSelf();
    }

    private void release() {
        if (mp != null) { try { mp.stop(); } catch (Exception ignored) { } mp.release(); mp = null; }
    }

    @Override public void onDestroy() { release(); super.onDestroy(); }
}
