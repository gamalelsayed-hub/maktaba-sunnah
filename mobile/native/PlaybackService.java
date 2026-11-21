package org.waqf.maktabasunnah;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

/** خدمة في المقدمة بإشعار تشغيل: تُبقي التطبيق حياً أثناء التلاوة والأذكار والقراءة الصوتية،
    وفيها أزرار التحكم (السابق / تشغيل-إيقاف مؤقت / التالي / إغلاق) في الإشعار وشاشة القفل وسماعة البلوتوث */
public class PlaybackService extends Service {
    static final String CH = "playback";
    static final String CTL = "org.waqf.maktabasunnah.PLAYBACK_CTL";
    static volatile boolean running = false;
    private PowerManager.WakeLock wl;
    private MediaSession ms;
    private String title = "زاد الأسرة", text = "";
    private boolean playing = true, controls = true;

    @Override public IBinder onBind(Intent i) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && CTL.equals(intent.getAction())) {
            String cmd = intent.getStringExtra("cmd");
            if (cmd != null) KeepAlivePlugin.emit(cmd);
            if (!running) stopSelf();
            return START_NOT_STICKY;
        }
        if (intent != null) {
            if (intent.getStringExtra("title") != null) title = intent.getStringExtra("title");
            if (intent.getStringExtra("text") != null) text = intent.getStringExtra("text");
            playing = intent.getBooleanExtra("playing", true);
            controls = intent.getBooleanExtra("controls", true);
        }
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null) {
            NotificationChannel c = new NotificationChannel(CH, "التشغيل في الخلفية", NotificationManager.IMPORTANCE_LOW);
            c.setShowBadge(false);
            c.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(c);
        }
        Notification n = build();
        if (Build.VERSION.SDK_INT >= 29) startForeground(7, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(7, n);
        if (wl == null) {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "maktaba:playback");
            wl.acquire(4 * 60 * 60 * 1000L);
        }
        running = true;
        return START_NOT_STICKY;
    }

    private PendingIntent ctl(String cmd, int code) {
        Intent i = new Intent(this, PlaybackService.class).setAction(CTL).putExtra("cmd", cmd);
        return PendingIntent.getService(this, 100 + code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private void session() {
        if (ms == null) {
            ms = new MediaSession(this, "zad-playback");
            ms.setCallback(new MediaSession.Callback() {
                @Override public void onPlay() { KeepAlivePlugin.emit("toggle"); }
                @Override public void onPause() { KeepAlivePlugin.emit("toggle"); }
                @Override public void onSkipToNext() { KeepAlivePlugin.emit("next"); }
                @Override public void onSkipToPrevious() { KeepAlivePlugin.emit("prev"); }
                @Override public void onStop() { KeepAlivePlugin.emit("stop"); }
                @Override public void onFastForward() { KeepAlivePlugin.emit("fwd"); }
                @Override public void onRewind() { KeepAlivePlugin.emit("back"); }
            });
            ms.setActive(true);
        }
        ms.setMetadata(new MediaMetadata.Builder()
            .putString(MediaMetadata.METADATA_KEY_TITLE, title)
            .putString(MediaMetadata.METADATA_KEY_ARTIST, text)
            .putString(MediaMetadata.METADATA_KEY_ALBUM, "زاد الأسرة المسلمة").build());
        ms.setPlaybackState(new PlaybackState.Builder()
            .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_PLAY_PAUSE
                | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS | PlaybackState.ACTION_STOP)
            .setState(playing ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED, PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1f).build());
    }

    private Notification build() {
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CH) : new Notification.Builder(this);
        b.setContentTitle(title).setContentText(text)
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setContentIntent(pi).setOngoing(true).setOnlyAlertOnce(true)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setCategory(Notification.CATEGORY_TRANSPORT);
        if (controls) {
            session();
            b.addAction(new Notification.Action.Builder(android.R.drawable.ic_media_previous, "السابق", ctl("prev", 1)).build());
            b.addAction(new Notification.Action.Builder(playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play, playing ? "إيقاف مؤقت" : "تشغيل", ctl("toggle", 2)).build());
            b.addAction(new Notification.Action.Builder(android.R.drawable.ic_media_next, "التالي", ctl("next", 3)).build());
            b.addAction(new Notification.Action.Builder(android.R.drawable.ic_menu_close_clear_cancel, "إغلاق", ctl("stop", 4)).build());
            b.setStyle(new Notification.MediaStyle().setMediaSession(ms.getSessionToken()).setShowActionsInCompactView(0, 1, 2));
        }
        return b.build();
    }

    @Override
    public void onDestroy() {
        running = false;
        if (wl != null && wl.isHeld()) wl.release();
        wl = null;
        if (ms != null) { try { ms.setActive(false); ms.release(); } catch (Exception ignored) { } ms = null; }
        if (Build.VERSION.SDK_INT >= 24) stopForeground(STOP_FOREGROUND_REMOVE); else stopForeground(true);
        super.onDestroy();
    }
}
