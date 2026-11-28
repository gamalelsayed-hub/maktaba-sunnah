package org.waqf.maktabasunnah;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KeepAlivePlugin.class);
        registerPlugin(FileOutPlugin.class);
        registerPlugin(AdhanPlugin.class);
        registerPlugin(BiometricPlugin.class);
        super.onCreate(savedInstanceState);
        // تكبير الصفحة بإصبعين (بلا أزرار تكبير ظاهرة)
        try {
            android.webkit.WebSettings ws = bridge.getWebView().getSettings();
            ws.setSupportZoom(true); ws.setBuiltInZoomControls(true); ws.setDisplayZoomControls(false);
        } catch (Exception ignored) { }
        goRoute(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        goRoute(intent);
    }

    /** فتح شاشة معيّنة من اختصارات ودجت الجوال (مثل أذكار الصباح) */
    private void goRoute(Intent in) {
        try {
            if (in == null) return;
            String r = in.getStringExtra("route");
            if (r == null || !r.matches("#/[A-Za-z0-9/_-]{1,60}")) return;
            in.removeExtra("route");
            final String js = "(function g(n){var v=document.getElementById('view');if(window.APP&&v){location.hash='" + r + "';}else if(n<80){setTimeout(function(){g(n+1)},250);}})(0)";
            bridge.getWebView().postDelayed(() -> bridge.getWebView().evaluateJavascript(js, null), 400);
        } catch (Exception ignored) { }
    }

    /** أثناء التشغيل في الخلفية: لا نوقف صفحة التطبيق عند قفل الشاشة حتى يكمل الصوت */
    @Override
    public void onPause() {
        super.onPause();
        if (PlaybackService.running) {
            try {
                if (bridge != null && bridge.getWebView() != null) { bridge.getWebView().onResume(); bridge.getWebView().resumeTimers(); }
            } catch (Exception ignored) { }
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        if (PlaybackService.running) {
            try {
                if (bridge != null && bridge.getWebView() != null) { bridge.getWebView().onResume(); bridge.getWebView().resumeTimers(); }
            } catch (Exception ignored) { }
        }
    }
}
