package org.waqf.maktabasunnah;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import org.json.JSONArray;

/** يشغّل الأذكار (الصباح / المساء / النوم) مسموعةً تلقائياً في وقتها والتطبيق مغلق،
    ذكراً بعد ذكر، مع أزرار: إيقاف مؤقت / التالي / إيقاف في الإشعار وشاشة القفل */
public class AdhkarService extends Service {
    static final String CTL = "org.waqf.maktabasunnah.ADHKAR_CTL";
    static final String CH = "adhkar_live";
    static final int NID = 7201;
    private MediaPlayer mp;
    private String[] urls = new String[0];
    private int idx = 0;
    private boolean paused = false;
    private String title = "📿 الأذكار";
    private PowerManager.WakeLock wl;

    @Override public IBinder onBind(Intent i) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && CTL.equals(intent.getAction())) {
            String cmd = intent.getStringExtra("cmd");
            if ("stop".equals(cmd)) { finish(); return START_NOT_STICKY; }
            if ("next".equals(cmd)) { playAt(idx + 1); return START_NOT_STICKY; }
            if ("toggle".equals(cmd) && mp != null) {
                try { if (paused) { mp.start(); paused = false; } else { mp.pause(); paused = true; } } catch (Exception ignored) { }
                notifyNow();
            }
            return START_NOT_STICKY;
        }
        String kind = intent != null ? intent.getStringExtra("kind") : null;
        if (intent != null && intent.getStringExtra("title") != null) title = intent.getStringExtra("title");
        try {
            JSONArray a = new JSONArray(AdhkarScheduler.prefs(this).getString("urls_" + kind, "[]"));
            urls = new String[a.length()];
            for (int k = 0; k < a.length(); k++) urls[k] = a.optString(k);
        } catch (Exception e) { urls = new String[0]; }
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null) {
            NotificationChannel c = new NotificationChannel(CH, "الأذكار المسموعة", NotificationManager.IMPORTANCE_DEFAULT);
            c.setSound(null, null);
            c.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(c);
        }
        Notification n = build();
        if (Build.VERSION.SDK_INT >= 29) startForeground(NID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(NID, n);
        if (wl == null) {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "maktaba:adhkar");
            wl.acquire(90 * 60 * 1000L);
        }
        if (urls.length == 0) { finish(); return START_NOT_STICKY; }
        playAt(0);
        return START_NOT_STICKY;
    }

    private PendingIntent ctl(String cmd, int code) {
        Intent i = new Intent(this, AdhkarService.class).setAction(CTL).putExtra("cmd", cmd);
        return PendingIntent.getService(this, 300 + code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private Notification build() {
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CH) : new Notification.Builder(this);
        String sub = urls.length > 0 ? "الذكر " + (idx + 1) + " من " + urls.length : "";
        b.setContentTitle(title).setContentText(sub)
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setContentIntent(pi).setOngoing(true).setOnlyAlertOnce(true)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setDeleteIntent(ctl("stop", 9))
            .addAction(new Notification.Action.Builder(paused ? android.R.drawable.ic_media_play : android.R.drawable.ic_media_pause, paused ? "تشغيل" : "إيقاف مؤقت", ctl("toggle", 1)).build())
            .addAction(new Notification.Action.Builder(android.R.drawable.ic_media_next, "التالي", ctl("next", 2)).build())
            .addAction(new Notification.Action.Builder(android.R.drawable.ic_menu_close_clear_cancel, "إيقاف", ctl("stop", 3)).build())
            .setStyle(new Notification.MediaStyle().setShowActionsInCompactView(0, 1, 2));
        return b.build();
    }

    private void notifyNow() {
        try { ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NID, build()); } catch (Exception ignored) { }
    }

    private void playAt(int i) {
        release();
        if (i >= urls.length) { finish(); return; }
        idx = i; paused = false; notifyNow();
        try {
            mp = new MediaPlayer();
            mp.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
            mp.setDataSource(urls[i]);
            mp.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK);
            mp.setOnPreparedListener(MediaPlayer::start);
            mp.setOnCompletionListener(m -> playAt(idx + 1));
            mp.setOnErrorListener((m, w, x) -> { playAt(idx + 1); return true; });
            mp.prepareAsync();
        } catch (Exception e) { playAt(i + 1); }
    }

    private void finish() {
        release();
        if (wl != null && wl.isHeld()) wl.release();
        wl = null;
        if (Build.VERSION.SDK_INT >= 24) stopForeground(STOP_FOREGROUND_REMOVE); else stopForeground(true);
        stopSelf();
    }

    private void release() {
        if (mp != null) { try { mp.stop(); } catch (Exception ignored) { } try { mp.release(); } catch (Exception ignored) { } mp = null; }
    }

    @Override public void onDestroy() { release(); if (wl != null && wl.isHeld()) wl.release(); super.onDestroy(); }
}
