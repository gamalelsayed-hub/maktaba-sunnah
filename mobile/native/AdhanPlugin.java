package org.waqf.maktabasunnah;

import android.content.Context;
import android.content.Intent;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** الأذان الحقيقي: منبّه دقيق من النظام يشغّل الأذان كاملاً على صوت المنبّه مع زر إيقاف */
@CapacitorPlugin(name = "Adhan")
public class AdhanPlugin extends Plugin {
    @PluginMethod
    public void schedule(PluginCall call) {
        Context ctx = getContext();
        JSArray items = call.getArray("items");
        AdhanScheduler.cancelAll(ctx);
        AdhanScheduler.save(ctx, items != null ? items.toString() : "[]");
        int n = AdhanScheduler.scheduleAll(ctx);
        JSObject r = new JSObject();
        r.put("count", n);
        r.put("exact", AdhanScheduler.canExact(ctx));
        call.resolve(r);
    }

    @PluginMethod
    public void test(PluginCall call) {
        Context ctx = getContext();
        Intent i = new Intent(ctx, AdhanService.class);
        i.putExtra("title", "🕌 تجربة الأذان");
        i.putExtra("body", "اضغط «إيقاف» لإيقافه");
        i.putExtra("fajr", call.getBoolean("fajr", false));
        if (call.getString("voice") != null) i.putExtra("voice", call.getString("voice"));
        try { ContextCompat.startForegroundService(ctx, i); call.resolve(); }
        catch (Exception e) { call.reject(e.getMessage()); }
    }

    /** اختيار صوت الأذان: afasy | makkah | shayba | custom */
    @PluginMethod
    public void setVoice(PluginCall call) {
        boolean fajr = call.getBoolean("fajr", false);
        getContext().getSharedPreferences("adhan", Context.MODE_PRIVATE).edit()
            .putString(fajr ? "voice_fajr" : "voice", call.getString("voice", fajr ? "shayba" : "afasy")).apply();
        call.resolve();
    }

    /** حفظ ملف أذان من جهاز المستخدم (base64) داخل التطبيق */
    @PluginMethod
    public void setCustom(PluginCall call) {
        boolean fajr = call.getBoolean("fajr", false);
        String data = call.getString("data");
        if (data == null) { call.reject("no data"); return; }
        try {
            byte[] bytes = android.util.Base64.decode(data, android.util.Base64.DEFAULT);
            java.io.File f = new java.io.File(getContext().getFilesDir(), fajr ? "adhan_custom_fajr.mp3" : "adhan_custom.mp3");
            try (java.io.FileOutputStream o = new java.io.FileOutputStream(f)) { o.write(bytes); }
            call.resolve();
        } catch (Exception e) { call.reject(e.getMessage()); }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Context ctx = getContext();
        Intent i = new Intent(ctx, AdhanService.class);
        i.setAction(AdhanService.STOP);
        try { ctx.startService(i); } catch (Exception ignored) { }
        call.resolve();
    }
}
