package org.waqf.maktabasunnah;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.hardware.biometrics.BiometricManager;
import android.hardware.biometrics.BiometricPrompt;
import android.os.Build;
import android.os.CancellationSignal;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** التحقق ببصمة الإصبع (أو الوجه) من نظام أندرويد، مع السماح برمز قفل الجهاز بديلاً.
    لا يرى التطبيق البصمة نفسها أبداً: النظام يتحقق ويخبرنا بالنتيجة فقط. */
@CapacitorPlugin(name = "Biometric")
public class BiometricPlugin extends Plugin {

    @PluginMethod
    public void available(PluginCall call) {
        JSObject o = new JSObject();
        boolean bio = false;
        try {
            if (Build.VERSION.SDK_INT >= 30) {
                BiometricManager bm = getContext().getSystemService(BiometricManager.class);
                bio = bm != null && bm.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK) == BiometricManager.BIOMETRIC_SUCCESS;
            } else if (Build.VERSION.SDK_INT >= 29) {
                BiometricManager bm = getContext().getSystemService(BiometricManager.class);
                bio = bm != null && bm.canAuthenticate() == BiometricManager.BIOMETRIC_SUCCESS;
            } else if (Build.VERSION.SDK_INT >= 28) {
                bio = getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_FINGERPRINT);
            }
        } catch (Exception ignored) { }
        boolean secure = false;
        try {
            KeyguardManager km = (KeyguardManager) getContext().getSystemService(Context.KEYGUARD_SERVICE);
            secure = km != null && km.isDeviceSecure();
        } catch (Exception ignored) { }
        o.put("biometric", bio);
        o.put("secure", secure);
        o.put("supported", Build.VERSION.SDK_INT >= 28);
        call.resolve(o);
    }

    @PluginMethod
    public void auth(final PluginCall call) {
        if (Build.VERSION.SDK_INT < 28) { call.reject("unsupported", "unsupported"); return; }
        getActivity().runOnUiThread(() -> {
            try {
                BiometricPrompt.Builder b = new BiometricPrompt.Builder(getContext())
                        .setTitle(call.getString("title", "تأكيد الهوية"))
                        .setSubtitle(call.getString("subtitle", "زاد الأسرة المسلمة"));
                if (Build.VERSION.SDK_INT >= 30) {
                    b.setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_WEAK | BiometricManager.Authenticators.DEVICE_CREDENTIAL);
                } else if (Build.VERSION.SDK_INT >= 29) {
                    b.setDeviceCredentialAllowed(true);
                } else {
                    b.setNegativeButton("إلغاء", getContext().getMainExecutor(), (d, w) -> call.reject("cancel", "cancel"));
                }
                BiometricPrompt p = b.build();
                p.authenticate(new CancellationSignal(), getContext().getMainExecutor(), new BiometricPrompt.AuthenticationCallback() {
                    @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult r) {
                        JSObject o = new JSObject(); o.put("ok", true); call.resolve(o);
                    }
                    @Override public void onAuthenticationError(int code, CharSequence msg) {
                        call.reject(String.valueOf(msg), String.valueOf(code));
                    }
                });
            } catch (Exception e) { call.reject(String.valueOf(e.getMessage()), "error"); }
        });
    }
}
