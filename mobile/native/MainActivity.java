package org.waqf.maktabasunnah;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KeepAlivePlugin.class);
        registerPlugin(FileOutPlugin.class);
        super.onCreate(savedInstanceState);
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
