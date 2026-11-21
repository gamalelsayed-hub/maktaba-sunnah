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
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;

/** مشغّل الإذاعات في أندرويد نفسه (لا في متصفح التطبيق): يتعامل مع تحويلات خوادم البث،
    ويستمر والشاشة مقفلة أو التطبيق مغلق، ويعيد الاتصال تلقائياً إذا انقطع البث. */
public class RadioService extends Service {
    static final String CTL = "org.waqf.maktabasunnah.RADIO_CTL";
    static final String CH = "radio_live";
    static final int NID = 7301;
    static volatile String nowUrl = null;
    private MediaPlayer mp;
    private String url, title = "📻 إذاعة القرآن الكريم", status = "جارٍ الاتصال…";
    private boolean paused = false;
    private int retries = 0;
    private PowerManager.WakeLock wl;
    private WifiManager.WifiLock wifi;
    private final Handler h = new Handler(Looper.getMainLooper());

    @Override public IBinder onBind(Intent i) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && CTL.equals(intent.getAction())) {
            String cmd = intent.getStringExtra("cmd");
            if ("stop".equals(cmd)) { finish(); return START_NOT_STICKY; }
            if ("toggle".equals(cmd)) {
                if (paused) { paused = false; connect(); }
                else { paused = true; release(); status = "متوقف مؤقتاً"; notifyNow(); }
            }
            return START_NOT_STICKY;
        }
        if (intent != null) {
            url = intent.getStringExtra("url");
            if (intent.getStringExtra("title") != null) title = "📻 " + intent.getStringExtra("title");
        }
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null) {
            NotificationChannel c = new NotificationChannel(CH, "الإذاعات", NotificationManager.IMPORTANCE_LOW);
            c.setShowBadge(false);
            c.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(c);
        }
        status = "جارٍ الاتصال…";
        Notification n = build();
        if (Build.VERSION.SDK_INT >= 29) startForeground(NID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(NID, n);
        if (wl == null) {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "maktaba:radio");
            wl.acquire(6 * 60 * 60 * 1000L);
        }
        if (wifi == null) {
            try { wifi = ((WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE)).createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "maktaba:radio"); wifi.acquire(); } catch (Exception ignored) { }
        }
        if (url == null) { finish(); return START_NOT_STICKY; }
        paused = false; retries = 0;
        connect();
        return START_NOT_STICKY;
    }

    private void connect() {
        release();
        nowUrl = url;
        status = "جارٍ الاتصال…"; notifyNow();
        try {
            mp = new MediaPlayer();
            mp.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
            mp.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK);
            mp.setDataSource(url);
            mp.setOnPreparedListener(m -> { m.start(); retries = 0; status = "🔴 بث مباشر"; notifyNow(); });
            mp.setOnErrorListener((m, w, x) -> { retry(); return true; });
            mp.setOnCompletionListener(m -> retry()); // البث المباشر لا ينتهي؛ الانتهاء يعني انقطاعاً
            mp.prepareAsync();
        } catch (Exception e) { retry(); }
    }

    private void retry() {
        release();
        if (paused) return;
        if (retries++ >= 4) { status = "تعذّر الاتصال — تحقق من الإنترنت"; notifyNow(); h.postDelayed(this::finish, 6000); return; }
        status = "انقطع البث — نعيد الاتصال…"; notifyNow();
        h.postDelayed(this::connect, 2500L * retries);
    }

    private PendingIntent ctl(String cmd, int code) {
        Intent i = new Intent(this, RadioService.class).setAction(CTL).putExtra("cmd", cmd);
        return PendingIntent.getService(this, 400 + code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private Notification build() {
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CH) : new Notification.Builder(this);
        b.setContentTitle(title).setContentText(status)
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setContentIntent(pi).setOngoing(true).setOnlyAlertOnce(true)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .addAction(new Notification.Action.Builder(paused ? android.R.drawable.ic_media_play : android.R.drawable.ic_media_pause, paused ? "تشغيل" : "إيقاف مؤقت", ctl("toggle", 1)).build())
            .addAction(new Notification.Action.Builder(android.R.drawable.ic_menu_close_clear_cancel, "إغلاق", ctl("stop", 2)).build())
            .setStyle(new Notification.MediaStyle().setShowActionsInCompactView(0, 1));
        return b.build();
    }

    private void notifyNow() {
        try { ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NID, build()); } catch (Exception ignored) { }
    }

    private void finish() {
        h.removeCallbacksAndMessages(null);
        release(); nowUrl = null;
        if (wl != null && wl.isHeld()) wl.release(); wl = null;
        if (wifi != null && wifi.isHeld()) wifi.release(); wifi = null;
        if (Build.VERSION.SDK_INT >= 24) stopForeground(STOP_FOREGROUND_REMOVE); else stopForeground(true);
        stopSelf();
    }

    private void release() {
        if (mp != null) { try { mp.stop(); } catch (Exception ignored) { } try { mp.release(); } catch (Exception ignored) { } mp = null; }
    }

    @Override public void onDestroy() {
        h.removeCallbacksAndMessages(null); release(); nowUrl = null;
        if (wl != null && wl.isHeld()) wl.release();
        if (wifi != null && wifi.isHeld()) wifi.release();
        super.onDestroy();
    }
}
