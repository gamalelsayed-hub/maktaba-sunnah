package org.waqf.maktabasunnah;

import android.content.Intent;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** يبدأ خدمة التشغيل في المقدمة حتى يستمر الصوت والشاشة مقفلة، ويحدّث إشعارها (العنوان وحالة التشغيل)،
    ويُرسل ضغطات أزرار الإشعار وشاشة القفل إلى التطبيق (حدث «control») */
@CapacitorPlugin(name = "KeepAlive")
public class KeepAlivePlugin extends Plugin {
    static KeepAlivePlugin inst;

    @Override public void load() { inst = this; }

    static void emit(String cmd) {
        KeepAlivePlugin p = inst;
        if (p == null) return;
        JSObject o = new JSObject();
        o.put("cmd", cmd);
        p.notifyListeners("control", o, true);
    }

    private void send(PluginCall call) {
        Intent i = new Intent(getContext(), PlaybackService.class);
        i.putExtra("title", call.getString("title", "زاد الأسرة"));
        i.putExtra("text", call.getString("text", ""));
        i.putExtra("playing", call.getBoolean("playing", true));
        i.putExtra("controls", call.getBoolean("controls", true));
        if (Build.VERSION.SDK_INT >= 26) getContext().startForegroundService(i); else getContext().startService(i);
    }

    @PluginMethod
    public void start(PluginCall call) {
        try { send(call); call.resolve(); } catch (Exception e) { call.reject(e.getMessage()); }
    }

    @PluginMethod
    public void update(PluginCall call) {
        try { if (PlaybackService.running) send(call); call.resolve(); } catch (Exception e) { call.reject(e.getMessage()); }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), PlaybackService.class));
        call.resolve();
    }
}
