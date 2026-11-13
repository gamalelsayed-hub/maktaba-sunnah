package org.waqf.maktabasunnah;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** بعد إعادة تشغيل الجوال أو تحديث التطبيق أو منح صلاحية المنبهات: إعادة جدولة الأذان */
public class AdhanBootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent in) { AdhanScheduler.scheduleAll(c); }
}
